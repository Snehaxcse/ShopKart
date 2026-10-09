import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import api from "../services/api";

function Navbar() {
  const navigate = useNavigate();
  const { cartCount, refreshCart } = useCart();

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const handleLogout = async () => {
    try {
      await api.post("/customers/logout");
    } catch (error) {
      // still send the user to login
    }
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/home" className="logo">
        ShopKart
      </Link>
      <div className="nav-links">
        <Link to="/home">Home</Link>
        <Link to="/products">Products</Link>
        <Link to="/wishlist">Wishlist</Link>
        <Link to="/cart">Cart ({cartCount})</Link>
        <Link to="/orders">My Orders</Link>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
