import type { IncomingMessage, ServerResponse } from "node:http";
import {
  hasAllowedOrigin,
  queryParam,
  readJson,
  requireJson,
  sendJson,
} from "../server/http.js";
import { notifyAdminOrder } from "../server/notifications.js";
import {
  setOrderPayment,
  toPublicOrder,
  verifyPaystackTransaction,
  type OrderRow,
} from "../server/orders.js";
import { getServiceSupabaseClient } from "../server/supabase.js";

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== "GET" && request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }
  if (
    request.method === "POST" &&
    (!hasAllowedOrigin(request) || !requireJson(request))
  ) {
    sendJson(response, hasAllowedOrigin(request) ? 415 : 403, {
      error: "Invalid payment verification request.",
    });
    return;
  }

  try {
    const reference =
      request.method === "GET"
        ? queryParam(request, "reference")
        : ((await readJson(request)) as { reference?: unknown })?.reference;
    if (
      typeof reference !== "string" ||
      !/^DPG-[A-Z0-9-]{10,80}$/.test(reference)
    ) {
      sendJson(response, 400, {
        error: "A valid order reference is required.",
      });
      return;
    }
    const client = getServiceSupabaseClient();
    const { data, error } = await client
      .from("dpg_orders")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      sendJson(response, 404, { error: "Order not found." });
      return;
    }
    let order = data as OrderRow;
    if (request.method === "POST" && order.payment_status === "pending") {
      const transaction = await verifyPaystackTransaction(
        order.provider_reference,
      );
      const updated = await setOrderPayment(client, order, transaction);
      if (updated.payment_status !== order.payment_status) {
        order = updated;
        await notifyAdminOrder(
          client,
          order,
          order.payment_status === "paid" ? "payment_paid" : "payment_failed",
        );
      }
    }
    sendJson(response, 200, { order: toPublicOrder(order) });
  } catch {
    console.error("Order status verification failed.");
    sendJson(response, 502, {
      error: "Unable to verify the order status right now.",
    });
  }
}
