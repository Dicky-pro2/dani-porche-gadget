import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "./database.types.js";

export type CheckoutInput = {
  idempotencyKey: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    deliveryNotes: string;
  };
  items: {
    productId: string;
    quantity: number;
    option: string;
    unitPrice: number;
  }[];
};
export type OrderRow = Database["public"]["Tables"]["dpg_orders"]["Row"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireText(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== "string") throw new Error(`${label} is required.`);
  const result = value.trim();
  if (result.length < min || result.length > max)
    throw new Error(`${label} must be between ${min} and ${max} characters.`);
  return result;
}

export function validateCheckoutInput(value: unknown): CheckoutInput {
  if (
    !isRecord(value) ||
    Object.keys(value).sort().join(",") !== "customer,idempotencyKey,items"
  )
    throw new Error("Invalid checkout request.");
  if (
    typeof value.idempotencyKey !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(value.idempotencyKey)
  )
    throw new Error("Invalid checkout key.");
  if (
    !isRecord(value.customer) ||
    Object.keys(value.customer).sort().join(",") !==
      "address,city,deliveryNotes,email,name,phone,state"
  )
    throw new Error("Invalid delivery details.");
  const customer = {
    name: requireText(value.customer.name, "Name", 2, 120),
    email: requireText(value.customer.email, "Email", 3, 254).toLowerCase(),
    phone: requireText(value.customer.phone, "Phone", 7, 32),
    address: requireText(value.customer.address, "Address", 4, 300),
    city: requireText(value.customer.city, "City", 2, 100),
    state: requireText(value.customer.state, "State", 2, 100),
    deliveryNotes:
      value.customer.deliveryNotes === ""
        ? ""
        : requireText(value.customer.deliveryNotes, "Delivery notes", 1, 500),
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))
    throw new Error("Enter a valid email address.");
  if (
    !Array.isArray(value.items) ||
    value.items.length < 1 ||
    value.items.length > 20
  )
    throw new Error("Your cart must contain between 1 and 20 products.");
  const items = value.items.map((entry) => {
    if (
      !isRecord(entry) ||
      Object.keys(entry).sort().join(",") !==
        "option,productId,quantity,unitPrice"
    )
      throw new Error("Invalid cart item.");
    if (
      typeof entry.quantity !== "number" ||
      !Number.isSafeInteger(entry.quantity) ||
      entry.quantity < 1 ||
      entry.quantity > 99
    )
      throw new Error("Quantity must be a whole number from 1 to 99.");
    if (
      typeof entry.unitPrice !== "number" ||
      !Number.isFinite(entry.unitPrice) ||
      entry.unitPrice < 0
    )
      throw new Error("Invalid product price.");
    return {
      productId: requireText(entry.productId, "Product", 1, 100),
      quantity: entry.quantity,
      option:
        entry.option === ""
          ? ""
          : requireText(entry.option, "Product option", 1, 80),
      unitPrice: entry.unitPrice,
    };
  });
  if (
    new Set(items.map((item) => `${item.productId}:${item.option}`)).size !==
    items.length
  )
    throw new Error("Remove duplicate options from your cart.");
  return { idempotencyKey: value.idempotencyKey, customer, items };
}

export function getDeliveryFee() {
  const fee = Number(process.env.DELIVERY_FEE_NGN || 0);
  if (
    !Number.isFinite(fee) ||
    fee < 0 ||
    fee > 100_000_000 ||
    Math.round(fee * 100) !== fee * 100
  )
    throw new Error("Invalid delivery fee configuration.");
  return fee;
}

export function createOrderReference() {
  return `DPG-${Date.now().toString(36).toUpperCase()}-${randomBytes(12).toString("hex").toUpperCase()}`;
}

function getPaystackSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret)
    throw new Error(
      "Paystack is not configured. Set PAYSTACK_SECRET_KEY on the server.",
    );
  return secret;
}

export async function initializePaystackTransaction(input: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl: string;
}) {
  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getPaystackSecret()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: String(Math.round(input.amount * 100)),
        currency: "NGN",
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: { order_reference: input.reference },
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );
  const result = (await response.json()) as {
    status?: boolean;
    data?: { authorization_url?: string; reference?: string };
  };
  if (
    !response.ok ||
    result.status !== true ||
    !result.data?.authorization_url ||
    result.data.reference !== input.reference
  ) {
    throw new Error("Unable to start secure payment. Please try again.");
  }
  return result.data.authorization_url;
}

export type PaystackTransaction = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  id: number | string;
  paid_at?: string | null;
};

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${getPaystackSecret()}` },
      signal: AbortSignal.timeout(15_000),
    },
  );
  const result = (await response.json()) as {
    status?: boolean;
    data?: PaystackTransaction;
  };
  if (!response.ok || result.status !== true || !result.data)
    throw new Error("Unable to verify payment with Paystack.");
  return result.data;
}

export function isValidPaystackSignature(
  rawBody: Buffer,
  signature: string | undefined,
) {
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac("sha512", getPaystackSecret())
    .update(rawBody)
    .digest();
  const received = Buffer.from(signature, "hex");
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

export function isMatchingSuccessfulTransaction(
  transaction: PaystackTransaction,
  order: OrderRow,
) {
  return (
    transaction.status === "success" &&
    transaction.reference === order.provider_reference &&
    transaction.currency === order.currency &&
    transaction.amount === Math.round(Number(order.total) * 100)
  );
}

export async function setOrderPayment(
  client: SupabaseClient<Database>,
  order: OrderRow,
  transaction: PaystackTransaction,
) {
  if (
    transaction.reference !== order.provider_reference ||
    transaction.currency !== order.currency ||
    transaction.amount !== Math.round(Number(order.total) * 100)
  )
    return order;
  const paid = isMatchingSuccessfulTransaction(transaction, order);
  const failureStatus =
    transaction.status === "abandoned" ? "expired" : "failed";
  const failed = ["failed", "abandoned"].includes(transaction.status);
  if (!paid && !failed) return order;
  const { data, error } = await client.rpc("dpg_set_order_payment", {
    p_reference: order.provider_reference,
    p_status: paid ? "paid" : failureStatus,
    p_transaction_id: String(transaction.id),
    p_paid_at: transaction.paid_at || null,
  });
  if (error) throw error;
  return data as OrderRow;
}

export function toPublicOrder(order: OrderRow) {
  return {
    reference: order.reference,
    items: order.items,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.delivery_fee),
    total: Number(order.total),
    currency: order.currency,
    paymentStatus: order.payment_status,
    fulfillmentStatus: order.fulfillment_status,
    createdAt: order.created_at,
  };
}

export function orderItemsJson(items: CheckoutInput["items"]): Json {
  return items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    option: item.option,
    unitPrice: item.unitPrice,
  }));
}
