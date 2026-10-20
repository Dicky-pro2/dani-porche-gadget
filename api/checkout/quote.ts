import type { IncomingMessage, ServerResponse } from "node:http";
import {
  hasAllowedOrigin,
  readJson,
  requireJson,
  sendJson,
} from "../../server/http.js";
import { getDeliveryFee } from "../../server/orders.js";
import { getServiceSupabaseClient } from "../../server/supabase.js";

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }
  if (!hasAllowedOrigin(request) || !requireJson(request)) {
    sendJson(response, hasAllowedOrigin(request) ? 415 : 403, {
      error: "Invalid cart quote request.",
    });
    return;
  }

  try {
    const body = (await readJson(request)) as { items?: unknown } | null;
    if (
      !body ||
      Object.keys(body).length !== 1 ||
      !Array.isArray(body.items) ||
      body.items.length < 1 ||
      body.items.length > 20
    ) {
      sendJson(response, 400, {
        error: "Your cart must contain between 1 and 20 products.",
      });
      return;
    }
    const items = body.items.map((value) => {
      if (typeof value !== "object" || value === null || Array.isArray(value))
        throw new Error("Invalid cart item.");
      const item = value as Record<string, unknown>;
      if (
        Object.keys(item).sort().join(",") !== "option,productId,quantity" ||
        typeof item.productId !== "string" ||
        item.productId.length > 100 ||
        typeof item.option !== "string" ||
        item.option.length > 80 ||
        typeof item.quantity !== "number" ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 99
      ) {
        throw new Error("Invalid cart item.");
      }
      return {
        productId: item.productId,
        option: item.option,
        quantity: item.quantity,
      };
    });
    if (
      new Set(items.map((item) => `${item.productId}:${item.option}`)).size !==
      items.length
    )
      throw new Error("Remove duplicate options from your cart.");

    const client = getServiceSupabaseClient();
    const { data, error } = await client
      .from("dpg_products")
      .select("id,name,reference,image,price,stock,reserved_stock,colors")
      .in(
        "id",
        items.map((item) => item.productId),
      )
      .eq("is_published", true);
    if (error) throw error;
    const requestedQuantities = new Map<string, number>();
    for (const item of items) {
      requestedQuantities.set(
        item.productId,
        (requestedQuantities.get(item.productId) || 0) + item.quantity,
      );
    }
    const products = items.map((item) => {
      const product = data.find((entry) => entry.id === item.productId);
      if (!product || product.price === null || product.price <= 0)
        throw new Error("A product is unavailable or has no listed price.");
      const availableStock = Math.max(
        0,
        product.stock - product.reserved_stock,
      );
      if (availableStock < (requestedQuantities.get(item.productId) || 0))
        throw new Error(
          `${product.name} does not have enough stock for this quantity.`,
        );
      if (
        product.colors.length &&
        (!item.option || !product.colors.includes(item.option))
      )
        throw new Error(`Choose an available option for ${product.name}.`);
      return {
        productId: product.id,
        name: product.name,
        reference: product.reference,
        image: product.image,
        quantity: item.quantity,
        option: item.option,
        unitPrice: Math.round(product.price * 100) / 100,
        lineTotal: (Math.round(product.price * 100) / 100) * item.quantity,
        availableStock,
      };
    });
    sendJson(response, 200, {
      currency: "NGN",
      deliveryFee: getDeliveryFee(),
      products,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const invalid = /invalid|cart|duplicate|quantity/i.test(message);
    sendJson(
      response,
      invalid ? 400 : /stock|unavailable|option/i.test(message) ? 409 : 503,
      {
        error: message || "Unable to calculate your order total.",
      },
    );
  }
}
