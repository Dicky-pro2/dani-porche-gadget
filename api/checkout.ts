import type { IncomingMessage, ServerResponse } from "node:http";
import {
  hasAllowedOrigin,
  readJson,
  requireJson,
  sendJson,
} from "../server/http.js";
import {
  createOrderReference,
  getDeliveryFee,
  initializePaystackTransaction,
  orderItemsJson,
  validateCheckoutInput,
  type OrderRow,
} from "../server/orders.js";
import { notifyAdminOrder } from "../server/notifications.js";
import { getServiceSupabaseClient } from "../server/supabase.js";

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }
  if (!hasAllowedOrigin(request)) {
    sendJson(response, 403, { error: "Request origin is not allowed." });
    return;
  }
  if (!requireJson(request)) {
    sendJson(response, 415, { error: "Send checkout details as JSON." });
    return;
  }

  try {
    const input = validateCheckoutInput(await readJson(request));
    const client = getServiceSupabaseClient();
    const reference = createOrderReference();
    const { data, error } = await client.rpc("dpg_create_order", {
      p_reference: reference,
      p_idempotency_key: input.idempotencyKey,
      p_customer: input.customer,
      p_items: orderItemsJson(input.items),
      p_delivery_fee: getDeliveryFee(),
    });
    if (error) throw error;
    let order = data as OrderRow;

    const storedItems = (
      order.items as {
        productId: string;
        quantity: number;
        option: string;
        unitPrice: number;
      }[]
    )
      .map(
        (item) =>
          `${item.productId}:${item.quantity}:${item.option}:${item.unitPrice}`,
      )
      .sort()
      .join("|");
    const requestedItems = input.items
      .map(
        (item) =>
          `${item.productId}:${item.quantity}:${item.option}:${item.unitPrice}`,
      )
      .sort()
      .join("|");
    if (
      order.email !== input.customer.email ||
      storedItems !== requestedItems ||
      order.customer_name !== input.customer.name ||
      order.phone !== input.customer.phone ||
      order.address !== input.customer.address ||
      order.city !== input.customer.city ||
      order.state !== input.customer.state ||
      order.delivery_notes !== input.customer.deliveryNotes
    ) {
      sendJson(response, 409, {
        error:
          "This checkout attempt was already used for different details. Refresh your checkout and try again.",
      });
      return;
    }
    if (order.payment_status !== "pending") {
      sendJson(response, 409, {
        error:
          "This checkout attempt is no longer payable. Start a new checkout.",
      });
      return;
    }

    let authorizationUrl = order.authorization_url;
    if (!authorizationUrl) {
      const { data: claimed, error: claimError } = await client.rpc(
        "dpg_claim_order_authorization",
        { p_reference: order.provider_reference },
      );
      if (claimError) throw claimError;
      if (!claimed) {
        sendJson(response, 409, {
          error:
            "Secure payment is being prepared. Retry checkout in a moment.",
        });
        return;
      }
      authorizationUrl = await initializePaystackTransaction({
        email: order.email,
        amount: Number(order.total),
        reference: order.provider_reference,
        callbackUrl: `${new URL(request.headers.origin as string).origin}/order/confirmation?reference=${encodeURIComponent(order.reference)}`,
      });
      const { data: saved, error: saveError } = await client.rpc(
        "dpg_set_order_authorization",
        {
          p_reference: order.provider_reference,
          p_authorization_url: authorizationUrl,
        },
      );
      if (saveError || !saved)
        throw saveError || new Error("Unable to save payment session.");
      const { data: refreshed, error: refreshError } = await client
        .from("dpg_orders")
        .select("*")
        .eq("id", order.id)
        .single();
      if (refreshError) throw refreshError;
      order = refreshed;
    }

    await notifyAdminOrder(client, order, "order_placed");
    sendJson(response, 200, { reference: order.reference, authorizationUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start checkout.";
    const status =
      /required|invalid|must be|cart|quantity|email address|product option/i.test(
        message,
      )
        ? 400
        : /stock|unavailable|option|already used|no longer payable|being prepared|price changed/i.test(
              message,
            )
          ? 409
          : /not configured/i.test(message)
            ? 503
            : 502;
    if (status === 502) console.error("Checkout service unavailable.");
    sendJson(response, status, {
      error:
        status === 502
          ? "Checkout could not be started. Please try again."
          : message,
    });
  }
}
