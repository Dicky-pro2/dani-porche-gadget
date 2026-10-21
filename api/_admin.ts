import type { IncomingMessage, ServerResponse } from "node:http";
import login from "../server/admin-api/login.js";
import logout from "../server/admin-api/logout.js";
import order from "../server/admin-api/order.js";
import orders from "../server/admin-api/orders.js";
import product from "../server/admin-api/product.js";
import products from "../server/admin-api/products.js";
import register from "../server/admin-api/register.js";
import session from "../server/admin-api/session.js";
import upload from "../server/admin-api/upload.js";
import { queryParam, sendJson } from "../server/http.js";
import {
  resolveAdminHandler,
  type AdminAction,
} from "../server/admin-api/routes.js";

type AdminHandler = (
  request: IncomingMessage,
  response: ServerResponse,
) => void | Promise<void>;

const handlers: Record<AdminAction, AdminHandler> = {
  login,
  logout,
  order,
  orders,
  product,
  products,
  register,
  session,
  upload,
};

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  const action = queryParam(request, "__dispatch");
  const routeHandler = resolveAdminHandler(handlers, action);
  if (!routeHandler) {
    sendJson(response, 404, { error: "Admin API route not found." });
    return;
  }
  await routeHandler(request, response);
}

