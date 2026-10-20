import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Container } from "../components/common/Container";
import { ProductGrid } from "../components/products/ProductGrid";
import { AddToCartButton } from "../components/products/AddToCartButton";
import { useProduct } from "../hooks/useProduct";
import { useProducts } from "../hooks/useProducts";
import { formatPrice, stockLabel } from "../services/whatsappService";

export function ProductDetailsPage() {
  const { slug = "" } = useParams();
  const { products } = useProducts();
  const { product, loading, error } = useProduct(slug);
  const [variant, setVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  if (loading)
    return (
      <Container>
        <div className="empty-state" role="status">
          Loading product…
        </div>
      </Container>
    );
  if (error)
    return (
      <Container>
        <div className="empty-state" role="alert">
          {error}
        </div>
      </Container>
    );
  if (!product)
    return (
      <Container>
        <div className="empty-state product-not-found">
          This product could not be found.{" "}
          <Link to="/shop">Return to the shop.</Link>
        </div>
      </Container>
    );
  const related = products
    .filter(
      (item) =>
        item.slug !== product.slug && item.category === product.category,
    )
    .slice(0, 4);
  return (
    <>
      <Container>
        <div className="breadcrumb detail-breadcrumb">
          <Link to="/shop">
            <ArrowLeft size={12} /> Shop
          </Link>
          <ChevronRight size={12} /> {product.name}
        </div>
        <div className="detail-layout">
          <div className="detail-image">
            <img
              src={product.image}
              alt={product.name}
              width="900"
              height="600"
            />
          </div>
          <div className="detail-copy">
            <div className="section-kicker">{product.brand}</div>
            <h1>{product.name}</h1>
            <div className="detail-price">{formatPrice(product.price)}</div>
            <div
              className={`stock-label${product.stock <= 3 ? " is-low" : ""}`}
            >
              {stockLabel(product.stock)}
            </div>
            <p>{product.description}</p>
            <div className="detail-note">
              <Check size={13} /> Prices and availability are checked again when
              you place your order.
            </div>
            <div className="variant-row">
              <label htmlFor="variant">Available option</label>
              <select
                id="variant"
                value={variant}
                onChange={(event) => setVariant(event.target.value)}
              >
                <option value="">Choose an option (optional)</option>
                {product.colors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>
            <div className="variant-row">
              <label htmlFor="quantity">Quantity</label>
              <input
                className="quantity-input"
                id="quantity"
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(event) =>
                  setQuantity(Math.max(1, Number(event.target.value) || 1))
                }
              />
            </div>
            <div className="detail-actions">
              <AddToCartButton
                product={product}
                option={variant}
                quantity={quantity}
              />
              <span className="prototype-note">
                Reference: {product.reference}
              </span>
            </div>
            <div className="filter-group">
              <h3>Product details</h3>
              {product.specs.map((spec) => (
                <div className="filter-option" key={spec}>
                  <Check size={13} /> {spec}
                </div>
              ))}
            </div>
          </div>
        </div>
        {related.length > 0 && (
          <section className="section products-section">
            <div className="section-kicker">Keep exploring</div>
            <h2 className="related-heading">You may also like</h2>
            <ProductGrid products={related} />
          </section>
        )}
      </Container>
    </>
  );
}
