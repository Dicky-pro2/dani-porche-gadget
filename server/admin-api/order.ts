import type { IncomingMessage, ServerResponse } from "node:http";
import {
  getAdminSupabaseClient,
  verifyAdminSessionOrRespond,
} from "../auth.js";
import {
  hasAllowedOrigin,
  queryParam,
  readJson,
  requireJson,
  sendJson,
} from "../http.js";
import { notifyAdminOrder } from "../notifications.js";
import type { OrderRow } from "../orders.js";
import { getServiceSupabaseClient } from "../supabase.js";

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  response.setHeader("Cache-Control", "no-store");
  const session = await verifyAdminSessionOrRespond(request, response);
  if (!session) return;
  if (request.method !== "PATCH") {
    response.setHeader("Allow", "PATCH");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }
  if (!hasAllowedOrigin(request) || !requireJson(request)) {
    sendJson(response, hasAllowedOrigin(request) ? 415 : 403, {
      error: "Invalid order update request.",
    });
    return;
  }
  const orderId = queryParam(request, "id");
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    sendJson(response, 400, { error: "A valid order id is required." });
    return;
  }
  try {
    const body = await readJson(request);
    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      !("fulfillmentStatus" in body)
    ) {
      sendJson(response, 400, { error: "Invalid fulfillment update." });
      return;
    }
    const fulfillmentStatus = (body as { fulfillmentStatus: unknown })
      .fulfillmentStatus;
    if (
      typeof fulfillmentStatus !== "string" ||
      !["unfulfilled", "processing", "shipped", "delivered"].includes(
        fulfillmentStatus,
      )
    ) {
      sendJson(response, 400, { error: "Invalid fulfillment status." });
      return;
    }
    const adminClient = getAdminSupabaseClient(session);
    const { data: current, error: currentError } = await adminClient
      .from("dpg_orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    if (currentError) throw currentError;
    if (!current) {
      sendJson(response, 404, { error: "Order not found." });
      return;
    }
    const { data, error } = await adminClient.rpc(
      "dpg_update_order_fulfillment",
      { p_order_id: orderId, p_status: fulfillmentStatus },
    );
    if (error) throw error;
    const order = data as OrderRow;
    if (current.fulfillment_status !== order.fulfillment_status) {
      await notifyAdminOrder(
        getServiceSupabaseClient(),
        order,
        `fulfillment_${order.fulfillment_status}_${Date.parse(order.updated_at)}`,
      );
    }
    sendJson(response, 200, { order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("payment is not complete")) {
      sendJson(response, 409, {
        error: "Only paid orders can be prepared for delivery.",
      });
      return;
    }
    console.error("Admin order update failed.");
    sendJson(response, 502, { error: "Unable to update this order." });
  }
}

