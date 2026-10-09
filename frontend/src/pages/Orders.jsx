import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { getOrders } from "../services/api";

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getOrders();
        setOrders(response.data.orders || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load your orders.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="page orders-page-shell">
        <div className="orders-page">
          <h1>My Orders</h1>

          {loading && <p className="loading">Loading your orders...</p>}

          {!loading && error && <p className="error">{error}</p>}

          {!loading && !error && orders.length === 0 && (
            <div className="empty-state">
              <p className="empty">You have not placed any orders yet.</p>
              <Link className="button-link" to="/products">
                Start Shopping
              </Link>
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <div className="order-list">
              {orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-meta">
                    <h2>Order #{String(order._id).slice(-8)}</h2>
                    <p>{new Date(order.createdAt).toLocaleDateString("en-GB")}</p>
                  </div>

                  <div className="order-items-preview">
                    {order.items?.slice(0, 2).map((item) => (
                      <p key={`${order._id}-${item.product}`}>
                        {item.name} × {item.quantity}
                      </p>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div>
                      <p>Total: ₹{Number(order.totalAmount).toLocaleString("en-IN")}</p>
                      <p>Status: {order.status}</p>
                    </div>
                    <button type="button" onClick={() => navigate(`/orders/${order._id}`)}>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Orders;
