import { CheckCircle2, CircleAlert, Clock3, PackageCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Container } from "../components/common/Container";
import { useCart } from "../context/cartStore";
import { routes } from "../constants/routes";
import { formatPrice } from "../services/whatsappService";

type ConfirmationOrder = {
  reference: string;
  items: {
    productId: string;
    name: string;
    option: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
};

export function OrderConfirmationPage() {
  const [search] = useSearchParams();
  const reference = search.get("reference") || "";
  const { clear } = useCart();
  const [order, setOrder] = useState<ConfirmationOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(reference));
  const [error, setError] = useState<string | null>(null);
  const [checkNumber, setCheckNumber] = useState(0);

  useEffect(() => {
    if (!reference) return;
    const controller = new AbortController();
    fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as {
          order?: ConfirmationOrder;
          error?: string;
        };
        if (!response.ok || !result.order)
          throw new Error(result.error || "Unable to verify payment status.");
        setOrder(result.order);
        if (result.order.paymentStatus === "paid") clear();
        if (result.order.paymentStatus !== "pending")
          sessionStorage.removeItem("dpg-checkout-attempt-v1");
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted)
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to verify payment status.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reference, clear, checkNumber]);

  const retryVerification = () => {
    setLoading(true);
    setError(null);
    setCheckNumber((current) => current + 1);
  };
  const visibleError = reference ? error : "The order reference is missing.";

  const status = order?.paymentStatus;
  const Icon =
    status === "paid"
      ? CheckCircle2
      : status === "failed"
        ? CircleAlert
        : Clock3;
  const heading =
    status === "paid"
      ? "Payment confirmed"
      : status === "failed"
        ? "Payment not completed"
        : "Payment confirmation pending";
  const detail =
    status === "paid"
      ? "Your payment has been verified and the order is now with the shop."
      : status === "failed"
        ? "The payment was not completed. Your reserved items have been released; you can return to the shop and try again."
        : "We have not received a confirmed payment yet. This page checks Paystack directly; please refresh the status in a moment.";

  return (
    <div className="confirmation-wrap">
      <Container>
        <div className="confirmation-panel">
          {loading ? (
            <div className="confirmation-loading" role="status">
              Checking your payment with Paystack…
            </div>
          ) : (
            <>
              <div className={`confirmation-icon is-${status || "pending"}`}>
                <Icon size={26} />
              </div>
              <div className="section-kicker">Dani Porshe Gadget</div>
              <h1>{visibleError ? "Order status unavailable" : heading}</h1>
              <p
                className="confirmation-copy"
                role={visibleError ? "alert" : undefined}
              >
                {visibleError || detail}
              </p>
              {order && (
                <>
                  <div className="order-reference">
                    <span>Order reference</span>
                    <strong>{order.reference}</strong>
                  </div>
                  <div className="confirmation-items">
                    {order.items.map((item) => (
                      <div key={`${item.productId}-${item.option}`}>
                        <span>
                          {item.name}
                          {item.option ? ` · ${item.option}` : ""} ×{" "}
                          {item.quantity}
                        </span>
                        <strong>
                          {formatPrice(item.unitPrice * item.quantity)}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <div className="confirmation-total">
                    <span>Total</span>
                    <strong>{formatPrice(order.total)}</strong>
                  </div>
                  <div className="confirmation-status">
                    <span>Payment</span>
                    <strong>{order.paymentStatus}</strong>
                    <span>Fulfillment</span>
                    <strong>{order.fulfillmentStatus}</strong>
                  </div>
                </>
              )}
              {visibleError || status === "pending" ? (
                <button
                  className="button button-primary"
                  type="button"
                  onClick={retryVerification}
                  disabled={loading}
                >
                  Check payment status
                </button>
              ) : null}
              {status === "paid" ? (
                <Link className="button button-primary" to={routes.shop}>
                  <PackageCheck size={15} /> Continue shopping
                </Link>
              ) : (
                <Link className="confirmation-text-link" to={routes.shop}>
                  Return to shop
                </Link>
              )}
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
