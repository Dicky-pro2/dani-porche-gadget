import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Container } from "../components/common/Container";
import { routes } from "../constants/routes";
import { useCart } from "../context/cartStore";
import { formatPrice } from "../services/whatsappService";

type QuoteLine = {
  productId: string;
  name: string;
  reference: string;
  image: string;
  quantity: number;
  option: string;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
};
type Quote = { currency: "NGN"; deliveryFee: number; products: QuoteLine[] };
type Customer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  deliveryNotes: string;
};
const emptyCustomer: Customer = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  deliveryNotes: "",
};

async function getCheckoutKey(fingerprint: string) {
  const storageKey = "dpg-checkout-attempt-v1";
  try {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(fingerprint),
    );
    const fingerprintHash = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    const existing = JSON.parse(
      sessionStorage.getItem(storageKey) || "null",
    ) as { fingerprintHash?: string; key?: string } | null;
    if (existing?.fingerprintHash === fingerprintHash && existing.key)
      return existing.key;
    const key = crypto.randomUUID();
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ fingerprintHash, key }),
    );
    return key;
  } catch {
    return crypto.randomUUID();
  }
}

export function CheckoutPage() {
  const { items } = useCart();
  const [customer, setCustomer] = useState(emptyCustomer);
  const [quoteState, setQuoteState] = useState<{
    fingerprint: string;
    quote?: Quote;
    error?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fingerprint = JSON.stringify(items);
  const currentQuoteState =
    quoteState?.fingerprint === fingerprint ? quoteState : null;
  const quote = currentQuoteState?.quote || null;
  const quoteError = currentQuoteState?.error || null;
  const loadingQuote = items.length > 0 && currentQuoteState === null;

  useEffect(() => {
    if (!items.length) return;
    const controller = new AbortController();
    fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as Quote & { error?: string };
        if (!response.ok)
          throw new Error(
            result.error || "Unable to confirm current prices and stock.",
          );
        setQuoteState({ fingerprint, quote: result });
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted)
          setQuoteState({
            fingerprint,
            error:
              caught instanceof Error
                ? caught.message
                : "Unable to calculate the order total.",
          });
      });
    return () => controller.abort();
  }, [fingerprint, items]);

  const subtotal =
    quote?.products.reduce((total, product) => total + product.lineTotal, 0) ||
    0;
  const total = subtotal + (quote?.deliveryFee || 0);
  const updateCustomer = (key: keyof Customer, value: string) =>
    setCustomer((current) => ({ ...current, [key]: value }));

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quote || !items.length) return;
    setSubmitting(true);
    setError(null);
    try {
      const requestBody = {
        idempotencyKey: await getCheckoutKey(
          JSON.stringify({ fingerprint, customer }),
        ),
        customer,
        items: quote.products.map(
          ({ productId, quantity, option, unitPrice }) => ({
            productId,
            quantity,
            option,
            unitPrice,
          }),
        ),
      };
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const result = (await response.json()) as {
        authorizationUrl?: string;
        error?: string;
      };
      if (!response.ok || !result.authorizationUrl)
        throw new Error(result.error || "Unable to start secure payment.");
      window.location.assign(result.authorizationUrl);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to start secure payment. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-hero">
        <Container>
          <div className="section-kicker">Secure order</div>
          <div className="page-heading">
            <h1>Checkout</h1>
            <p>Your payment is completed securely on Paystack.</p>
          </div>
        </Container>
      </div>
      <Container>
        {!items.length ? (
          <div className="empty-state cart-empty">
            <p>Your cart is empty.</p>
            <Link className="button button-primary" to={routes.shop}>
              Browse products
            </Link>
          </div>
        ) : (
          <form
            className="checkout-layout"
            onSubmit={(event) => void submitOrder(event)}
          >
            <div className="checkout-main">
              <section className="checkout-section">
                <div className="checkout-section-heading">
                  <span>01</span>
                  <div>
                    <h2>Contact details</h2>
                    <p>Used only to process and deliver this order.</p>
                  </div>
                </div>
                <div className="checkout-fields">
                  <label className="checkout-field checkout-field-wide">
                    Full name
                    <input
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={120}
                      value={customer.name}
                      onChange={(event) =>
                        updateCustomer("name", event.target.value)
                      }
                    />
                  </label>
                  <label className="checkout-field">
                    Email address
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      value={customer.email}
                      onChange={(event) =>
                        updateCustomer("email", event.target.value)
                      }
                    />
                  </label>
                  <label className="checkout-field">
                    Phone number
                    <input
                      type="tel"
                      autoComplete="tel"
                      required
                      minLength={7}
                      maxLength={32}
                      value={customer.phone}
                      onChange={(event) =>
                        updateCustomer("phone", event.target.value)
                      }
                    />
                  </label>
                </div>
              </section>
              <section className="checkout-section">
                <div className="checkout-section-heading">
                  <span>02</span>
                  <div>
                    <h2>Delivery details</h2>
                    <p>Provide the address where your order should arrive.</p>
                  </div>
                </div>
                <div className="checkout-fields">
                  <label className="checkout-field checkout-field-wide">
                    Street address
                    <input
                      autoComplete="street-address"
                      required
                      minLength={4}
                      maxLength={300}
                      value={customer.address}
                      onChange={(event) =>
                        updateCustomer("address", event.target.value)
                      }
                    />
                  </label>
                  <label className="checkout-field">
                    City
                    <input
                      autoComplete="address-level2"
                      required
                      minLength={2}
                      maxLength={100}
                      value={customer.city}
                      onChange={(event) =>
                        updateCustomer("city", event.target.value)
                      }
                    />
                  </label>
                  <label className="checkout-field">
                    State
                    <input
                      autoComplete="address-level1"
                      required
                      minLength={2}
                      maxLength={100}
                      value={customer.state}
                      onChange={(event) =>
                        updateCustomer("state", event.target.value)
                      }
                    />
                  </label>
                  <label className="checkout-field checkout-field-wide">
                    Delivery notes{" "}
                    <span className="field-optional">Optional</span>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={customer.deliveryNotes}
                      onChange={(event) =>
                        updateCustomer("deliveryNotes", event.target.value)
                      }
                    />
                  </label>
                </div>
              </section>
              <section className="checkout-section payment-method">
                <div className="checkout-section-heading">
                  <span>03</span>
                  <div>
                    <h2>Payment</h2>
                    <p>
                      Card, bank transfer and other options available through
                      Paystack.
                    </p>
                  </div>
                </div>
                <div className="payment-provider">
                  <LockKeyhole size={19} />
                  <div>
                    <strong>Paystack secure checkout</strong>
                    <span>
                      Your card details are entered on Paystack and are never
                      stored on this site.
                    </span>
                  </div>
                  <ShieldCheck size={18} />
                </div>
              </section>
            </div>
            <aside className="checkout-summary">
              <h2>Your order</h2>
              {loadingQuote ? (
                <p role="status">Checking prices and availability…</p>
              ) : quoteError ? (
                <p className="checkout-error" role="alert">
                  {quoteError}
                </p>
              ) : (
                quote?.products.map((line) => (
                  <div className="checkout-item" key={line.productId}>
                    <img src={line.image} alt="" width="56" height="56" />
                    <div>
                      <strong>{line.name}</strong>
                      <span>
                        {line.quantity} × {formatPrice(line.unitPrice)}
                        {line.option ? ` · ${line.option}` : ""}
                      </span>
                    </div>
                    <b>{formatPrice(line.lineTotal)}</b>
                  </div>
                ))
              )}
              <div className="checkout-cost">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="checkout-cost">
                <span>Delivery</span>
                <strong>{quote ? formatPrice(quote.deliveryFee) : "—"}</strong>
              </div>
              <div className="checkout-total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              {error && (
                <p className="checkout-error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="button button-primary checkout-submit"
                type="submit"
                disabled={
                  !quote || loadingQuote || submitting || Boolean(quoteError)
                }
              >
                <LockKeyhole size={15} />
                {submitting ? "Opening Paystack…" : `Pay ${formatPrice(total)}`}
              </button>
              <p className="checkout-terms">
                By continuing, you’ll be redirected to Paystack to complete
                payment.
              </p>
              <Link className="checkout-back" to={routes.cart}>
                Return to cart
              </Link>
            </aside>
          </form>
        )}
      </Container>
    </>
  );
}
