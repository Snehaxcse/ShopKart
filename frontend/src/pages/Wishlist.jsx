import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { getWishlist, removeFromWishlist } from "../services/api";

function Wishlist() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState("");

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getWishlist();
      setProducts(response.data.wishlist);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError("Unable to load wishlist.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
      setProducts((current) =>
        current.filter((product) => product._id !== productId),
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove product.");
    } finally {
      setRemovingId("");
    }
  };

  return (
    <div>
      <Navbar />
      <main className="page catalog">
        <h1>My Wishlist</h1>
        {loading && <p className="loading">Loading your wishlist...</p>}
        {!loading && error && (
          <div>
            <p className="error">{error}</p>
            <button type="button" onClick={loadWishlist}>
              Try Again
            </button>
          </div>
        )}
        {!loading && !error && products.length === 0 && (
          <div className="empty-state">
            <p className="empty">Your wishlist is empty ❤️</p>
            <p>Start saving products you love.</p>
            <Link className="button-link" to="/products">
              Browse Products
            </Link>
          </div>
        )}
        {!loading && !error && products.length > 0 && (
          <div>
            <p>
              {products.length} product{products.length === 1 ? "" : "s"} saved
            </p>
            <div className="product-grid">
              {products.map((product) => (
                <article className="product-card" key={product._id}>
                  <img src={product.image} alt={product.name} />
                  <div className="product-card-body">
                    <h2>{product.name}</h2>
                    <p className="muted">{product.category}</p>
                    <p className="price">
                      ₹{product.price.toLocaleString("en-IN")}
                    </p>
                    <p>
                      {product.stock > 0
                        ? `${product.stock} units left`
                        : "Out of stock"}
                    </p>
                    <Link to={`/products/${product._id}`}>View Details</Link>
                    <button
                      type="button"
                      onClick={() => handleRemove(product._id)}
                      disabled={removingId === product._id}
                    >
                      {removingId === product._id
                        ? "Removing..."
                        : "Remove from Wishlist"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Wishlist;
