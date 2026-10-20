import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.js";
import type { OrderRow } from "./orders.js";

type NotificationEvent =
  | "order_placed"
  | "payment_paid"
  | "payment_failed"
  | `fulfillment_${string}`;

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] || character,
  );
}

export async function notifyAdminOrder(
  client: SupabaseClient<Database>,
  order: OrderRow,
  event: NotificationEvent,
) {
  const { data: notificationId, error } = await client.rpc(
    "dpg_claim_order_notification",
    { p_order_id: order.id, p_event_type: event },
  );
  if (error || !notificationId) return;
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.ADMIN_NOTIFICATION_EMAIL;
  const sender = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !recipient || !sender) {
    await client.rpc("dpg_finish_order_notification", {
      p_notification_id: notificationId,
      p_sent: false,
      p_error: "Email notification settings are missing.",
    });
    return;
  }

  const subjects: Record<string, string> = {
    order_placed: `New order ${order.reference} awaiting payment`,
    payment_paid: `Payment received for ${order.reference}`,
    payment_failed: `Payment failed for ${order.reference}`,
  };
  const subject =
    subjects[event] || `Order ${order.reference} fulfillment update`;
  const items = Array.isArray(order.items)
    ? (order.items as Record<string, unknown>[])
    : [];
  const lines = items.map(
    (item) =>
      `${String(item.name)} x ${String(item.quantity)}${item.option ? ` (${String(item.option)})` : ""}`,
  );
  const text = [
    subject,
    `Reference: ${order.reference}`,
    `Payment: ${order.payment_status}`,
    `Fulfillment: ${order.fulfillment_status}`,
    `Customer: ${order.customer_name} | ${order.email} | ${order.phone}`,
    `Delivery: ${order.address}, ${order.city}, ${order.state}`,
    ...lines,
    `Total: NGN ${Number(order.total).toLocaleString("en-NG")}`,
  ].join("\n");
  const html = `<h2>${escapeHtml(subject)}</h2><p><strong>Reference:</strong> ${escapeHtml(order.reference)}<br><strong>Payment:</strong> ${escapeHtml(order.payment_status)}<br><strong>Fulfillment:</strong> ${escapeHtml(order.fulfillment_status)}</p><p><strong>Customer:</strong> ${escapeHtml(order.customer_name)}<br>${escapeHtml(order.email)}<br>${escapeHtml(order.phone)}</p><p><strong>Delivery:</strong> ${escapeHtml(order.address)}, ${escapeHtml(order.city)}, ${escapeHtml(order.state)}</p><ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul><p><strong>Total:</strong> NGN ${Number(order.total).toLocaleString("en-NG")}</p>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": notificationId,
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        subject,
        text,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok)
      throw new Error("Notification provider rejected the request.");
    await client.rpc("dpg_finish_order_notification", {
      p_notification_id: notificationId,
      p_sent: true,
    });
  } catch {
    await client.rpc("dpg_finish_order_notification", {
      p_notification_id: notificationId,
      p_sent: false,
      p_error: "Notification delivery failed.",
    });
  }
}

export async function retryPendingOrderNotifications(
  client: SupabaseClient<Database>,
  orders: OrderRow[],
) {
  if (
    !process.env.RESEND_API_KEY ||
    !process.env.ADMIN_NOTIFICATION_EMAIL ||
    !process.env.RESEND_FROM_EMAIL ||
    !orders.length
  )
    return;
  const byId = new Map(orders.map((order) => [order.id, order]));
  const { data, error } = await client
    .from("dpg_order_notifications")
    .select("order_id,event_type,status,locked_until")
    .in("order_id", [...byId.keys()])
    .in("status", ["pending", "sending"])
    .order("created_at", { ascending: true })
    .limit(5);
  if (error) return;
  const now = Date.now();
  await Promise.all(
    (data || []).map(async (notification) => {
      if (
        notification.status === "sending" &&
        notification.locked_until &&
        Date.parse(notification.locked_until) > now
      )
        return;
      const event = notification.event_type;
      if (
        !["order_placed", "payment_paid", "payment_failed"].includes(event) &&
        !/^fulfillment_(processing|shipped|delivered)_\d+$/.test(event)
      )
        return;
      const order = byId.get(notification.order_id);
      if (order)
        await notifyAdminOrder(client, order, event as NotificationEvent);
    }),
  );
}
