import { ShoppingCart } from "lucide-react";
import { useState } from "react";
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
  const [cardOption, setCardOption] = useState(option);
  const selectedOption = compact ? cardOption : option;
  const unavailable =
    product.stock < 1 || product.price === null || product.price <= 0;
  const requiresOption = product.colors.length > 0 && !selectedOption;
  const exceedsStock = quantity > product.stock;

  return (
    <div className={`add-to-cart-action${compact ? " is-compact" : ""}`}>
      {compact && product.colors.length > 0 && (
        <label className="product-card-option">
          <span className="sr-only">Choose an option for {product.name}</span>
          <select
            aria-label={`Choose an option for ${product.name}`}
            value={cardOption}
            onChange={(event) => setCardOption(event.target.value)}
          >
            <option value="">Choose option</option>
            {product.colors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        className="button button-primary"
        type="button"
        disabled={unavailable || requiresOption || exceedsStock}
        onClick={() => {
          addItem(product.id, selectedOption, quantity);
          setNotice(`${product.name} added to cart.`);
        }}
      >
        <ShoppingCart size={compact ? 14 : 16} />
        {product.price === null || product.price <= 0
          ? "Price unavailable"
          : product.stock < 1
            ? "Out of stock"
            : requiresOption
              ? compact ? "Choose option above" : "Choose an option"
              : exceedsStock
                ? `Only ${product.stock} available`
                : "Add to cart"}
      </button>
      <span className="cart-action-notice" role="status" aria-live="polite">
        {notice}
      </span>
    </div>
  );
}
