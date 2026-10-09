import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { getOrderById } from "../services/api";

function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getOrderById(id);
        setOrder(response.data.order);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load this order.");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="page">
          <p className="loading">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <Navbar />
        <div className="page">
          <div className="empty-state">
            <p className="empty">{error || "Order not found."}</p>
            <Link className="button-link" to="/orders">
              My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="page order-detail-shell">
        <div className="order-detail-card">
          <h1>Order #{String(order._id).slice(-8)}</h1>
          <p className="muted">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-GB")}
          </p>

          <div className="detail-row">
            <span>Total</span>
            <strong>₹{Number(order.totalAmount).toLocaleString("en-IN")}</strong>
          </div>

          <div className="detail-row">
            <span>Status</span>
            <strong>{order.status}</strong>
          </div>

          <div className="detail-row">
            <span>Payment</span>
            <strong>{order.paymentStatus}</strong>
          </div>

          <div className="shipping-box">
            <h2>Shipping Address</h2>
            <p>{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.addressLine1}</p>
            <p>
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            </p>
            <p>{order.shippingAddress?.phone}</p>
          </div>

          <div className="order-items-list">
            <h2>Items</h2>
            {order.items?.map((item) => (
              <div key={`${order._id}-${item.product}`} className="order-item-row">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>
                  ₹{(Number(item.price) * Number(item.quantity)).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
