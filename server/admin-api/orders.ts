import type { IncomingMessage, ServerResponse } from "node:http";
import {
  getAdminSupabaseClient,
  verifyAdminSessionOrRespond,
} from "../auth.js";
import { sendJson, queryParam } from "../http.js";
import { retryPendingOrderNotifications } from "../notifications.js";
import { getServiceSupabaseClient } from "../supabase.js";

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  response.setHeader("Cache-Control", "no-store");
  const session = await verifyAdminSessionOrRespond(request, response);
  if (!session) return;
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }
  try {
    let query = getAdminSupabaseClient(session)
      .from("dpg_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const search = queryParam(request, "search")
      ?.trim()
      .replace(/[%,_]/g, "")
      .slice(0, 100);
    const payment = queryParam(request, "payment");
    const fulfillment = queryParam(request, "fulfillment");
    if (search)
      query = query.or(
        `reference.ilike.%${search}%,customer_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
      );
    if (payment && ["pending", "paid", "failed", "expired"].includes(payment))
      query = query.eq("payment_status", payment);
    if (
      fulfillment &&
      ["unfulfilled", "processing", "shipped", "delivered"].includes(
        fulfillment,
      )
    )
      query = query.eq("fulfillment_status", fulfillment);
    const { data, error } = await query;
    if (error) throw error;
    if (data?.length)
      await retryPendingOrderNotifications(getServiceSupabaseClient(), data);
    sendJson(response, 200, { orders: data });
  } catch {
    console.error("Admin order list failed.");
    sendJson(response, 502, { error: "Unable to load orders." });
  }
}

