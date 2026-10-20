import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "../../services/whatsappService";

type OrderLine = {
  productId: string;
  name: string;
  reference: string;
  option: string;
  quantity: number;
  unitPrice: number;
};
type Order = {
  id: string;
  reference: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  delivery_notes: string;
  items: OrderLine[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_status: "pending" | "paid" | "failed" | "expired";
  fulfillment_status: "unfulfilled" | "processing" | "shipped" | "delivered";
  provider_reference: string;
  provider_transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
};

const fulfillmentOptions: Order["fulfillment_status"][] = [
  "unfulfilled",
  "processing",
  "shipped",
  "delivered",
];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState("");
  const [fulfillment, setFulfillment] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (payment) params.set("payment", payment);
      if (fulfillment) params.set("fulfillment", fulfillment);
      setLoading(true);
      setError(null);
      fetch(`/api/admin/orders?${params}`, { signal: controller.signal })
        .then(async (response) => {
          const result = (await response.json()) as {
            orders?: Order[];
            error?: string;
          };
          if (!response.ok)
            throw new Error(result.error || "Unable to load orders.");
          setOrders(result.orders || []);
        })
        .catch((caught: unknown) => {
          if (!controller.signal.aborted)
            setError(
              caught instanceof Error
                ? caught.message
                : "Unable to load orders.",
            );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, payment, fulfillment]);

  const saveFulfillment = async (
    order: Order,
    nextStatus: Order["fulfillment_status"],
  ) => {
    setSavingId(order.id);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/admin/order?id=${encodeURIComponent(order.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fulfillmentStatus: nextStatus }),
        },
      );
      const result = (await response.json()) as {
        order?: Order;
        error?: string;
      };
      if (!response.ok || !result.order)
        throw new Error(result.error || "Unable to update fulfillment status.");
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? result.order! : item)),
      );
      setNotice(`${order.reference} updated to ${nextStatus}.`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update this order.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Orders</h1>
          <p>Payment status and fulfillment for customer orders.</p>
        </div>
      </div>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="admin-success" role="status">
          {notice}
        </p>
      )}
      <div className="admin-actions admin-order-filters">
        <label className="admin-order-search">
          <Search size={14} />
          <input
            aria-label="Search orders"
            placeholder="Search reference, name, email or phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          Payment{" "}
          <select
            value={payment}
            onChange={(event) => setPayment(event.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="expired">Expired</option>
          </select>
        </label>
        <label>
          Fulfillment{" "}
          <select
            value={fulfillment}
            onChange={(event) => setFulfillment(event.target.value)}
          >
            <option value="">All</option>
            <option value="unfulfilled">Unfulfilled</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </label>
      </div>
      <section className="admin-panel admin-table-wrap">
        {loading ? (
          <p role="status">Loading orders…</p>
        ) : !orders.length ? (
          <div className="admin-empty">No orders match these filters.</div>
        ) : (
          <table className="admin-table admin-orders-table">
            <thead>
              <tr>
                <th>ORDER</th>
                <th>CUSTOMER</th>
                <th>TOTAL</th>
                <th>PAYMENT</th>
                <th>FULFILLMENT</th>
                <th>PLACED</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <>
                  <tr key={order.id}>
                    <td>
                      <strong>{order.reference}</strong>
                    </td>
                    <td>
                      {order.customer_name}
                      <small>{order.email}</small>
                    </td>
                    <td>{formatPrice(Number(order.total))}</td>
                    <td>
                      <span
                        className={`admin-order-status is-${order.payment_status}`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td>
                      {order.payment_status === "paid" ? (
                        <select
                          className="admin-fulfillment-select"
                          aria-label={`Fulfillment for ${order.reference}`}
                          value={order.fulfillment_status}
                          disabled={savingId === order.id}
                          onChange={(event) =>
                            void saveFulfillment(
                              order,
                              event.target.value as Order["fulfillment_status"],
                            )
                          }
                        >
                          {fulfillmentOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="admin-order-status">
                          {order.fulfillment_status}
                        </span>
                      )}
                    </td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-order-details-button"
                        aria-expanded={selectedId === order.id}
                        onClick={() =>
                          setSelectedId((current) =>
                            current === order.id ? null : order.id,
                          )
                        }
                      >
                        {selectedId === order.id ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>
                  {selectedId === order.id && (
                    <tr
                      className="admin-order-detail-row"
                      key={`${order.id}-detail`}
                    >
                      <td colSpan={7}>
                        <div className="admin-order-detail">
                          <div>
                            <h3>Items</h3>
                            {order.items.map((line) => (
                              <p key={`${line.productId}-${line.option}`}>
                                {line.name}
                                {line.option ? ` · ${line.option}` : ""} ×{" "}
                                {line.quantity}{" "}
                                <strong>
                                  {formatPrice(
                                    Number(line.unitPrice) * line.quantity,
                                  )}
                                </strong>
                              </p>
                            ))}
                          </div>
                          <div>
                            <h3>Delivery</h3>
                            <p>
                              {order.customer_name}
                              <br />
                              {order.phone}
                              <br />
                              {order.address}, {order.city}, {order.state}
                              {order.delivery_notes ? (
                                <>
                                  <br />
                                  Note: {order.delivery_notes}
                                </>
                              ) : null}
                            </p>
                          </div>
                          <div>
                            <h3>Summary</h3>
                            <p>
                              Subtotal {formatPrice(Number(order.subtotal))}
                              <br />
                              Delivery {formatPrice(Number(order.delivery_fee))}
                              <br />
                              <strong>
                                Total {formatPrice(Number(order.total))}
                              </strong>
                            </p>
                          </div>
                          <div>
                            <h3>Payment</h3>
                            <p>
                              Provider: Paystack
                              <br />
                              Reference: {order.provider_reference}
                              <br />
                              Transaction:{" "}
                              {order.provider_transaction_id || "Not available"}
                              <br />
                              Paid at:{" "}
                              {order.paid_at
                                ? formatDate(order.paid_at)
                                : "Not paid"}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
