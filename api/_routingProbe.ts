import type { IncomingMessage, ServerResponse } from "node:http";

export default function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify({ url: request.url }));
}
