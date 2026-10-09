import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { useCart } from "../context/CartContext.jsx";
import { createPaymentOrder, verifyPayment } from "../services/api";

const defaultForm = {
  fullName: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  pincode: "",
};

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay."));
    document.body.appendChild(script);
  });

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartCount, loading, refreshCart, clearCart } = useCart();
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    if (!loading && cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems, loading, navigate]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total + Number(item.product?.price || 0) * Number(item.quantity || 0),
        0,
      ),
    [cartItems],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};

    Object.entries(form).forEach(([key, value]) => {
      const trimmed = String(value).trim();
      if (!trimmed) {
        nextErrors[key] = "This field is required.";
      }
    });

    if (form.phone && !/^[0-9+\-\s()]{10,15}$/.test(form.phone.trim())) {
      nextErrors.phone = "Phone number is invalid.";
    }

    if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
      nextErrors.pincode = "Pincode must contain 6 digits.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setServerError("");

    try {
      const response = await createPaymentOrder({
        shippingAddress: {
          ...form,
          phone: form.phone.trim(),
          pincode: form.pincode.trim(),
        },
      });

      await loadRazorpayScript();

      const { razorpay, shopkartOrderId } = response.data;
      if (!razorpay?.key || !razorpay.orderId || !shopkartOrderId) {
        throw new Error("Payment order response is incomplete. Please try again.");
      }

      const options = {
        key: razorpay.key,
        amount: razorpay.amount,
        currency: razorpay.currency,
        order_id: razorpay.orderId,
        name: "ShopKart",
        description: "Order Payment",
        handler: async (paymentResponse) => {
          try {
            await verifyPayment({
              orderId: shopkartOrderId,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            });

            clearCart();
            navigate(`/order-success/${shopkartOrderId}`);
          } catch (error) {
            setServerError(
              error.response?.data?.message ||
                "Payment verification failed. Please try again.",
            );
          }
        },
        prefill: {
          name: form.fullName,
          contact: form.phone,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            setServerError("Payment cancelled. Your cart remains unchanged.");
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      setServerError(
        error.response?.data?.message ||
          error.message ||
          "Unable to create payment order.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="page">
          <p className="loading">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div>
        <Navbar />
        <div className="page">
          <div className="empty-state">
            <p className="empty">Your cart is empty.</p>
            <Link className="button-link" to="/products">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="page checkout-page-shell">
        <div className="checkout-page">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <h1>Checkout</h1>

            <div className="checkout-section">
              <h2>Shipping Details</h2>

              <div className="form-grid">
                <div>
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                  />
                  {errors.fullName && <p className="field-error">{errors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                  {errors.phone && <p className="field-error">{errors.phone}</p>}
                </div>

                <div className="full-width">
                  <label htmlFor="addressLine1">Address</label>
                  <input
                    id="addressLine1"
                    name="addressLine1"
                    value={form.addressLine1}
                    onChange={handleChange}
                  />
                  {errors.addressLine1 && (
                    <p className="field-error">{errors.addressLine1}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                  />
                  {errors.city && <p className="field-error">{errors.city}</p>}
                </div>

                <div>
                  <label htmlFor="state">State</label>
                  <input
                    id="state"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                  />
                  {errors.state && <p className="field-error">{errors.state}</p>}
                </div>

                <div>
                  <label htmlFor="pincode">Pincode</label>
                  <input
                    id="pincode"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                  />
                  {errors.pincode && <p className="field-error">{errors.pincode}</p>}
                </div>
              </div>
            </div>

            <div className="checkout-section summary-box">
              <h2>Order Summary</h2>

              {cartItems.map((item) => {
                const product = item.product;
                if (!product) {
                  return null;
                }

                return (
                  <div key={product._id} className="summary-row">
                    <span>
                      {product.name} × {item.quantity}
                    </span>
                    <span>
                      ₹{(Number(product.price) * Number(item.quantity)).toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })}

              <div className="summary-total">
                <span>Total</span>
                <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
              </div>

              <div className="payment-note">
                <strong>Payment via Razorpay</strong>
                <p>Secure Test Mode checkout opens after you continue.</p>
              </div>

              {serverError && <p className="error">{serverError}</p>}

              <button type="submit" disabled={submitting}>
                {submitting ? "Preparing payment..." : `Continue to Razorpay (${cartCount})`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
