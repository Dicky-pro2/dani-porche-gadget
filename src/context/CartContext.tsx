import {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { CartContext, type CartItem } from "./cartStore";

const storageKey = "dpg-cart-v1";

function loadCart(): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(storageKey) || "[]",
    );
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        typeof item?.productId === "string" &&
        typeof item?.option === "string" &&
        Number.isSafeInteger(item?.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 99,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const addItem = (productId: string, option: string, quantity: number) => {
    setItems((current) => {
      const existing = current.find(
        (item) => item.productId === productId && item.option === option,
      );
      if (!existing)
        return [
          ...current,
          { productId, option, quantity: Math.min(99, quantity) },
        ];
      return current.map((item) =>
        item === existing
          ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
          : item,
      );
    });
  };
  const setQuantity = (productId: string, option: string, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId && item.option === option
          ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) }
          : item,
      ),
    );
  };
  const removeItem = (productId: string, option: string) => {
    setItems((current) =>
      current.filter(
        (item) => item.productId !== productId || item.option !== option,
      ),
    );
  };
  const clear = useCallback(
    () => setItems((current) => (current.length ? [] : current)),
    [],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.reduce((total, item) => total + item.quantity, 0),
        addItem,
        setQuantity,
        removeItem,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
