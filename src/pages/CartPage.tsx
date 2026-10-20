import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Container } from "../components/common/Container";
import { useCart } from "../context/cartStore";
import { routes } from "../constants/routes";
import { useProducts } from "../hooks/useProducts";
import { formatPrice } from "../services/whatsappService";

export function CartPage() {
  const { items, setQuantity, removeItem } = useCart();
  const { products, loading } = useProducts();
  const lines = items.map((item) => ({
    item,
    product: products.find((product) => product.id === item.productId),
  }));
  const subtotal = lines.reduce(
    (total, line) => total + (line.product?.price || 0) * line.item.quantity,
    0,
  );
  const hasUnavailable = lines.some(
    ({ item, product }) =>
      !product ||
      !product.price ||
      product.stock < item.quantity ||
      (product.colors.length > 0 && !item.option),
  );

  return (
    <>
      <div className="page-hero">
        <Container>
          <div className="section-kicker">Your selection</div>
          <div className="page-heading">
            <h1>Shopping cart</h1>
            <p>Review your items and quantities before checkout.</p>
          </div>
        </Container>
      </div>
      <Container>
        {loading && !products.length ? (
          <div className="empty-state" role="status">
            Loading your cart…
          </div>
        ) : !items.length ? (
          <div className="empty-state cart-empty">
            <p>Your cart is empty.</p>
            <Link className="button button-primary" to={routes.shop}>
              Browse products
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-lines" aria-label="Cart items">
              {lines.map(({ item, product }) => (
                <article
                  className="cart-line"
                  key={`${item.productId}-${item.option}`}
                >
                  {product ? (
                    <img src={product.image} alt="" width="120" height="120" />
                  ) : (
                    <div className="cart-missing">Unavailable</div>
                  )}
                  <div className="cart-line-main">
                    <div className="product-brand">
                      {product?.brand || "Unavailable item"}
                    </div>
                    <h2>
                      {product?.name || "This product is no longer available"}
                    </h2>
                    {item.option && (
                      <p className="cart-option">Option: {item.option}</p>
                    )}
                    {product && product.colors.length > 0 && !item.option && (
                      <p className="cart-warning">
                        Choose an option on the product page before checkout.
                      </p>
                    )}
                    {product && item.quantity > product.stock && (
                      <p className="cart-warning">
                        Only {product.stock} currently available.
                      </p>
                    )}
                    <div className="cart-line-bottom">
                      <div
                        className="cart-quantity"
                        aria-label={`Quantity of ${product?.name || "item"}`}
                      >
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            setQuantity(
                              item.productId,
                              item.option,
                              item.quantity - 1,
                            )
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={
                            !product ||
                            item.quantity >= Math.min(99, product.stock)
                          }
                          onClick={() =>
                            setQuantity(
                              item.productId,
                              item.option,
                              item.quantity + 1,
                            )
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <strong>
                        {product?.price
                          ? formatPrice(product.price * item.quantity)
                          : "Price unavailable"}
                      </strong>
                    </div>
                  </div>
                  <button
                    className="cart-remove"
                    type="button"
                    aria-label={`Remove ${product?.name || "item"} from cart`}
                    onClick={() => removeItem(item.productId, item.option)}
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              ))}
              <Link className="cart-continue" to={routes.shop}>
                <ArrowLeft size={14} /> Continue shopping
              </Link>
            </section>
            <aside className="cart-summary">
              <h2>Order summary</h2>
              <div>
                <span>Items subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div>
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
              <p>
                Final prices, available stock and delivery charges are confirmed
                before payment.
              </p>
              <Link
                className={`button button-primary${hasUnavailable ? " is-disabled" : ""}`}
                aria-disabled={hasUnavailable}
                to={hasUnavailable ? "#" : routes.checkout}
                onClick={(event) => {
                  if (hasUnavailable) event.preventDefault();
                }}
              >
                Continue to checkout
              </Link>
            </aside>
          </div>
        )}
      </Container>
    </>
  );
}
