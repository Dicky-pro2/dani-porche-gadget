import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  getDeliveryFee,
  isMatchingSuccessfulTransaction,
  isValidPaystackSignature,
  validateCheckoutInput,
} from "../server/orders.ts";

const validCheckout = () => ({
  idempotencyKey: "6a75f9f8-4017-4a5b-98c7-efca46245a97",
  customer: {
    name: "Ada Customer",
    email: "ADA@example.com",
    phone: "+2348012345678",
    address: "12 Example Road",
    city: "Lagos",
    state: "Lagos",
    deliveryNotes: "",
  },
  items: [
    { productId: "product-1", quantity: 2, option: "Black", unitPrice: 12500 },
  ],
});

test("checkout validation normalizes email and accepts a minimal delivery payload", () => {
  const validated = validateCheckoutInput(validCheckout());
  assert.equal(validated.customer.email, "ada@example.com");
  assert.equal(validated.items[0].unitPrice, 12500);
  assert.equal(validated.items[0].quantity, 2);
});

test("checkout validation rejects tampered fields, quantities, duplicate products, and invalid email", () => {
  assert.throws(() => validateCheckoutInput({ ...validCheckout(), total: 1 }));
  assert.throws(() =>
    validateCheckoutInput({
      ...validCheckout(),
      items: [{ ...validCheckout().items[0], quantity: 1.5 }],
    }),
  );
  assert.throws(() =>
    validateCheckoutInput({
      ...validCheckout(),
      items: [validCheckout().items[0], validCheckout().items[0]],
    }),
  );
  assert.throws(() =>
    validateCheckoutInput({
      ...validCheckout(),
      customer: { ...validCheckout().customer, email: "bad-email" },
    }),
  );
});

test("Paystack webhook signature uses HMAC-SHA512 and rejects invalid signatures", () => {
  const previous = process.env.PAYSTACK_SECRET_KEY;
  process.env.PAYSTACK_SECRET_KEY = "test-secret";
  try {
    const body = Buffer.from('{"event":"charge.success"}');
    const signature = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(body)
      .digest("hex");
    assert.equal(isValidPaystackSignature(body, signature), true);
    assert.equal(isValidPaystackSignature(body, "0".repeat(128)), false);
    assert.equal(isValidPaystackSignature(body, undefined), false);
  } finally {
    if (previous === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = previous;
  }
});

test("successful transactions must match the server order reference, currency, and amount", () => {
  const order = {
    provider_reference: "DPG-ORDER-1234567890",
    currency: "NGN",
    total: 25000,
  };
  const transaction = {
    status: "success",
    reference: order.provider_reference,
    currency: "NGN",
    amount: 2_500_000,
    id: 42,
  };
  assert.equal(isMatchingSuccessfulTransaction(transaction, order), true);
  assert.equal(
    isMatchingSuccessfulTransaction({ ...transaction, amount: 1 }, order),
    false,
  );
  assert.equal(
    isMatchingSuccessfulTransaction(
      { ...transaction, reference: "other" },
      order,
    ),
    false,
  );
  assert.equal(
    isMatchingSuccessfulTransaction({ ...transaction, currency: "USD" }, order),
    false,
  );
});

test("delivery fee configuration rejects values Paystack cannot represent in NGN minor units", () => {
  const previous = process.env.DELIVERY_FEE_NGN;
  try {
    process.env.DELIVERY_FEE_NGN = "2500";
    assert.equal(getDeliveryFee(), 2500);
    process.env.DELIVERY_FEE_NGN = "10.001";
    assert.throws(() => getDeliveryFee());
  } finally {
    if (previous === undefined) delete process.env.DELIVERY_FEE_NGN;
    else process.env.DELIVERY_FEE_NGN = previous;
  }
});
