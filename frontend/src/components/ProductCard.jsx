import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { addToWishlist } from "../services/api";

function ProductCard({ product }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart, cartItems } = useCart();

  const isInCart = cartItems.some(
    (item) => item.product?._id === product._id || item.product === product._id,
  );

  const handleAddToWishlist = async () => {
    if (saving || saved) return;

    setSaving(true);
    setError("");
    try {
      await addToWishlist(product._id);
      setSaved(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save product. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddToCart = async () => {
    if (addingToCart || product.stock <= 0) return;

    setAddingToCart(true);
    setError("");

    try {
      await addToCart(product._id);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add product to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <article className="product-card">
      <img src={product.image} alt={product.name} />
      <div className="product-card-body">
        <h2>{product.name}</h2>
        <p className="muted">{product.category}</p>
        <p className="price">₹{product.price.toLocaleString("en-IN")}</p>
        <p>
          {product.stock > 0 ? `${product.stock} units left` : "Out of stock"}
        </p>
        <Link to={`/products/${product._id}`}>View Details</Link>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={addingToCart || product.stock <= 0}
        >
          {product.stock <= 0
            ? "Out of stock"
            : addingToCart
              ? "Adding..."
              : isInCart
                ? "Add Another"
                : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={handleAddToWishlist}
          disabled={saving || saved}
        >
          {saving
            ? "Saving..."
            : saved
              ? "Added to Wishlist"
              : "Add to Wishlist"}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    </article>
  );
}

export default ProductCard;
