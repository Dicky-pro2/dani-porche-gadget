import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { productPath } from "../../constants/routes";
import { useCart } from "../../context/cartStore";
import type { Product } from "../../data/products";

export function AddToCartButton({
  product,
  option = "",
  quantity = 1,
  compact = false,
}: {
  product: Product;
  option?: string;
  quantity?: number;
  compact?: boolean;
}) {
  const { addItem } = useCart();
  const [notice, setNotice] = useState("");
  const unavailable =
    product.stock < 1 || product.price === null || product.price <= 0;
  const requiresOption = product.colors.length > 0 && !option;
  const exceedsStock = quantity > product.stock;

  if (requiresOption && compact)
    return (
      <Link className="button button-primary" to={productPath(product.slug)}>
        Choose options
      </Link>
    );
  return (
    <div className="add-to-cart-action">
      <button
        className="button button-primary"
        type="button"
        disabled={unavailable || requiresOption || exceedsStock}
        onClick={() => {
          addItem(product.id, option, quantity);
          setNotice(`${product.name} added to cart.`);
        }}
      >
        <ShoppingCart size={compact ? 14 : 16} />
        {product.price === null || product.price <= 0
          ? "Price unavailable"
          : product.stock < 1
            ? "Out of stock"
            : exceedsStock
              ? `Only ${product.stock} available`
              : requiresOption
                ? "Choose an option"
                : "Add to cart"}
      </button>
      <span className="cart-action-notice" role="status" aria-live="polite">
        {notice}
      </span>
    </div>
  );
}
