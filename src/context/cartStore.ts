import { createContext, useContext } from "react";

export type CartItem = { productId: string; option: string; quantity: number };
export type CartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (productId: string, option: string, quantity: number) => void;
  setQuantity: (productId: string, option: string, quantity: number) => void;
  removeItem: (productId: string, option: string) => void;
  clear: () => void;
};

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider.");
  return context;
}
