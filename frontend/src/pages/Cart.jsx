import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { useCart } from "../context/CartContext.jsx";

function Cart() {
  const navigate = useNavigate();
  const {
    cartItems,
    cartCount,
    loading,
    error,
    refreshCart,
    updateCart,
    removeCartItem,
  } = useCart();

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const subtotal = cartItems.reduce(
    (total, item) =>
      total + Number(item.product?.price || 0) * Number(item.quantity || 0),
    0,
  );

  const handleQuantityUpdate = async (productId, nextQuantity) => {
    if (nextQuantity < 1) {
      return;
    }

    try {
      await updateCart(productId, nextQuantity);
    } catch (err) {
      // error is already surfaced by the context
    }
  };

  return (
    <div>
      <Navbar />
      <div className="page cart-page-shell">
        {loading && <p className="loading">Loading your cart...</p>}

        {!loading && error && (
          <div className="empty-state">
            <p className="empty">Unable to load your cart.</p>
            <button type="button" onClick={refreshCart}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && cartItems.length === 0 && (
          <div className="empty-state">
            <p className="empty">Your cart is empty 🛒</p>
            <p>Looks like you haven't added anything yet.</p>
            <Link className="button-link" to="/products">
              Browse Products
            </Link>
          </div>
        )}

        {!loading && !error && cartItems.length > 0 && (
          <div className="cart-page">
            <div className="cart-main">
              <h1>My Cart</h1>

              {cartItems.map((item) => {
                const product = item.product;
                const quantity = item.quantity;

                if (!product) {
                  return null;
                }

                return (
                  <div className="cart-item" key={product._id}>
                    <img src={product.image} alt={product.name} />
                    <div className="cart-item-details">
                      <h2>{product.name}</h2>
                      <p className="price">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </p>

                      <div className="cart-controls">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityUpdate(product._id, quantity - 1)
                          }
                          disabled={quantity <= 1}
                          className="small-button"
                        >
                          -
                        </button>
                        <span className="quantity-value">{quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityUpdate(product._id, quantity + 1)
                          }
                          disabled={quantity >= Number(product.stock || 0)}
                          className="small-button"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="remove-button"
                          onClick={() => removeCartItem(product._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="cart-line-total">
                      ₹
                      {(Number(product.price) * quantity).toLocaleString(
                        "en-IN",
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="cart-summary">
              <h2>Order Summary</h2>
              <p>Items: {cartCount}</p>
              <p>Subtotal: ₹{subtotal.toLocaleString("en-IN")}</p>
              <button type="button" onClick={() => navigate("/checkout")}>
                Proceed to Checkout
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
