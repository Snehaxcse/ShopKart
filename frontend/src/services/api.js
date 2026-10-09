import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});

export const getProducts = (params) => api.get("/products", { params });

export const getProductById = (id) => api.get(`/products/${id}`);
export const getWishlist = () => api.get("/wishlist");
export const addToWishlist = (productId) => api.post(`/wishlist/${productId}`);
export const removeFromWishlist = (productId) =>
  api.delete(`/wishlist/${productId}`);

export const getCart = () => api.get("/cart");
export const addToCart = (productId) => api.post(`/cart/${productId}`);
export const updateCartItemQuantity = (productId, data) =>
  api.patch(`/cart/${productId}`, data);
export const removeFromCart = (productId) => api.delete(`/cart/${productId}`);

export const createPaymentOrder = (shippingAddress) =>
  api.post("/orders/create-payment-order", shippingAddress);
export const verifyPayment = (payload) => api.post("/orders/verify-payment", payload);
export const getOrders = () => api.get("/orders");
export const getOrderById = (id) => api.get(`/orders/${id}`);

export default api;
