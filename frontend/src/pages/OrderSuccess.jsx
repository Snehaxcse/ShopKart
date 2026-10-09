import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { getOrderById } from "../services/api";

function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const response = await getOrderById(id);
        setOrder(response.data.order);
      } catch (error) {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadOrder();
    }
  }, [id]);

  return (
    <div>
      <Navbar />
      <div className="page order-success-shell">
        <div className="success-card">
          {loading && <p className="loading">Confirming your order...</p>}

          {!loading && order && (
            <>
              <h1>✅ Order Placed Successfully</h1>
              <p>
                <strong>Order ID:</strong> {String(order._id).slice(-8)}
              </p>
              <p>
                <strong>Total:</strong> ₹{Number(order.totalAmount).toLocaleString("en-IN")}
              </p>
              <p>
                <strong>Status:</strong> {order.status}
              </p>
              <p>Your order has been saved successfully.</p>
              <div className="success-actions">
                <button type="button" onClick={() => navigate(`/orders/${order._id}`)}>
                  View My Orders
                </button>
                <button type="button" className="secondary-button" onClick={() => navigate("/products")}>
                  Continue Shopping
                </button>
              </div>
            </>
          )}

          {!loading && !order && (
            <div className="empty-state">
              <p className="empty">Unable to confirm the order.</p>
              <Link className="button-link" to="/orders">
                View My Orders
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
