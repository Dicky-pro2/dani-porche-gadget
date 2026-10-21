export const adminActions = [
  "login",
  "logout",
  "order",
  "orders",
  "product",
  "products",
  "register",
  "session",
  "upload",
] as const;

export type AdminAction = (typeof adminActions)[number];

export function resolveAdminHandler<T>(
  handlers: Partial<Record<AdminAction, T>>,
  action: string | null,
) {
  if (!action || !adminActions.includes(action as AdminAction)) return undefined;
  return handlers[action as AdminAction];
}
