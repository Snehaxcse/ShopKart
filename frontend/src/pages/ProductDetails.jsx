import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { useCart } from "../context/CartContext.jsx";
import { getProductById } from "../services/api";

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart, cartItems } = useCart();

  const isInCart = product
    ? cartItems.some(
        (item) =>
          item.product?._id === product._id || item.product === product._id,
      )
    : false;

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await getProductById(id);
        setProduct(res.data);
      } catch (err) {
        setError("Something went wrong while loading products.");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0 || addingToCart) return;

    setAddingToCart(true);
    try {
      await addToCart(product._id);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add product to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="page catalog">
        {loading && <p className="loading">Loading products...</p>}

        {!loading && error && <p className="error">{error}</p>}

        {!loading && !error && !product && (
          <p className="empty">No products found.</p>
        )}

        {!loading && !error && product && (
          <div className="details">
            <img src={product.image} alt={product.name} />
            <div>
              <h1>{product.name}</h1>
              <p className="muted">{product.category}</p>
              <p>{product.description}</p>
              <p className="price">₹{product.price.toLocaleString("en-IN")}</p>
              <p>
                {product.stock > 0
                  ? `${product.stock} units left`
                  : "Out of stock"}
              </p>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetails;
