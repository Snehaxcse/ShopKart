import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import api from "../services/api";

function Home() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/customers/me");
        setCustomer(res.data);
      } catch (error) {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  if (!customer) {
    return null;
  }

  return (
    <div>
      <Navbar />
      <div className="page profile">
        <div className="card">
          <h1>Welcome, {customer.fullName}</h1>
          <p>
            <strong>Name:</strong> {customer.fullName}
          </p>
          <p>
            <strong>Email:</strong> {customer.email}
          </p>
          <p>
            <strong>Phone:</strong> {customer.phone}
          </p>
          <button type="button" onClick={() => navigate("/products")}>
            Browse Products
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
