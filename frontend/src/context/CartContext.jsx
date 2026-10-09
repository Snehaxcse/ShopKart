import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  addToCart as addToCartApi,
  getCart,
  removeFromCart as removeFromCartApi,
  updateCartItemQuantity,
} from "../services/api";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshCart = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getCart();
      setCartItems(response.data.cart || []);
    } catch (err) {
      setCartItems([]);
      setError(err.response?.data?.message || "Unable to load your cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (productId) => {
    setError("");
    const response = await addToCartApi(productId);
    setCartItems(response.data.cart || []);
    return response;
  }, []);

  const updateCart = useCallback(async (productId, quantity) => {
    setError("");
    const response = await updateCartItemQuantity(productId, { quantity });
    setCartItems(response.data.cart || []);
    return response;
  }, []);

  const removeCartItem = useCallback(async (productId) => {
    setError("");
    const response = await removeFromCartApi(productId);
    setCartItems(response.data.cart || []);
    return response;
  }, []);

  const clearCart = useCallback(() => {
    setError("");
    setCartItems([]);
  }, []);

  const cartCount = useMemo(
    () =>
      cartItems.reduce((total, item) => total + Number(item.quantity || 0), 0),
    [cartItems],
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        loading,
        error,
        setError,
        refreshCart,
        addToCart,
        updateCart,
        removeCartItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
