import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    try {
      await api.post("/customers/login", form);
      navigate("/home");
    } catch (err) {
      if (!err.response) {
        setError("Cannot connect to server. Start the backend first.");
      } else if (err.response.status === 401) {
        setError("Invalid Credentials");
      } else {
        setError(err.response.data?.message || "Login failed");
      }
    }
  };

  return (
    <div className="page">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Login</h1>

        {error && <p className="error">{error}</p>}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit">Login</button>

        <p className="link-text">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
