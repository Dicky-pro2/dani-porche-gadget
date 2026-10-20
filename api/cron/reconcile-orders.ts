import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../../server/http.js";
import {
  notifyAdminOrder,
  retryPendingOrderNotifications,
} from "../../server/notifications.js";
import {
  setOrderPayment,
  verifyPaystackTransaction,
  type OrderRow,
} from "../../server/orders.js";
import { getServiceSupabaseClient } from "../../server/supabase.js";

function isAuthorized(request: IncomingMessage) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.authorization;
  if (!secret || typeof authorization !== "string") return false;
  const supplied = authorization.replace(/^Bearer\s+/i, "");
  const expectedBytes = Buffer.from(secret);
  const suppliedBytes = Buffer.from(supplied);
  return (
    suppliedBytes.length === expectedBytes.length &&
    timingSafeEqual(suppliedBytes, expectedBytes)
  );
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }
  if (!isAuthorized(request)) {
    sendJson(response, 401, { error: "Unauthorized." });
    return;
  }

  try {
    const client = getServiceSupabaseClient();
    const { data, error } = await client
      .from("dpg_orders")
      .select("*")
      .eq("payment_status", "pending")
      .lte("reservation_expires_at", new Date().toISOString())
      .order("reservation_expires_at", { ascending: true })
      .limit(20);
    if (error) throw error;
    const reconciliations = await Promise.allSettled(
      (data || []).map(async (row) => {
        const order = row as OrderRow;
        const transaction = await verifyPaystackTransaction(
          order.provider_reference,
        );
        const next = await setOrderPayment(client, order, transaction);
        if (next.payment_status === order.payment_status) return false;
        await notifyAdminOrder(
          client,
          next,
          next.payment_status === "paid" ? "payment_paid" : "payment_failed",
        );
        return true;
      }),
    );
    const { data: recentOrders, error: recentError } = await client
      .from("dpg_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (recentError) throw recentError;
    await retryPendingOrderNotifications(
      client,
      (recentOrders || []) as OrderRow[],
    );
    const updated = reconciliations.filter(
      (result) => result.status === "fulfilled" && result.value,
    ).length;
    const failed = reconciliations.filter(
      (result) => result.status === "rejected",
    ).length;
    if (failed) console.error(`Order reconciliation failures: ${failed}`);
    sendJson(response, 200, { checked: data?.length || 0, updated });
  } catch {
    console.error("Scheduled order reconciliation failed.");
    sendJson(response, 502, { error: "Order reconciliation failed." });
  }
}
