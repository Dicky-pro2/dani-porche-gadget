import { Buffer } from "node:buffer";
import type { IncomingMessage, ServerResponse } from "node:http";
import { notifyAdminOrder } from "../../server/notifications.js";
import {
  isValidPaystackSignature,
  setOrderPayment,
  verifyPaystackTransaction,
  type OrderRow,
} from "../../server/orders.js";
import { getServiceSupabaseClient } from "../../server/supabase.js";

export const config = { api: { bodyParser: false } };

async function readRawBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const part = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk as Uint8Array);
    size += part.length;
    if (size > 64 * 1024) throw new Error("Webhook payload too large.");
    chunks.push(part);
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.statusCode = 405;
    response.end();
    return;
  }
  try {
    const rawBody = await readRawBody(request);
    const signature = request.headers["x-paystack-signature"];
    if (
      !isValidPaystackSignature(
        rawBody,
        typeof signature === "string" ? signature : undefined,
      )
    ) {
      response.statusCode = 401;
      response.end();
      return;
    }
    const event = JSON.parse(rawBody.toString("utf8")) as {
      event?: string;
      data?: { reference?: string };
    };
    if (
      event.event !== "charge.success" ||
      typeof event.data?.reference !== "string"
    ) {
      response.statusCode = 200;
      response.end("ok");
      return;
    }
    const client = getServiceSupabaseClient();
    const { data, error } = await client
      .from("dpg_orders")
      .select("*")
      .eq("provider_reference", event.data.reference)
      .maybeSingle();
    if (error) throw error;
    if (data && data.payment_status === "pending") {
      const previousStatus = data.payment_status;
      const transaction = await verifyPaystackTransaction(
        data.provider_reference,
      );
      const order = await setOrderPayment(
        client,
        data as OrderRow,
        transaction,
      );
      if (order.payment_status !== previousStatus)
        await notifyAdminOrder(client, order, "payment_paid");
    }
    response.statusCode = 200;
    response.end("ok");
  } catch {
    console.error("Paystack webhook processing failed.");
    response.statusCode = 500;
    response.end();
  }
}
