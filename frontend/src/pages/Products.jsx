import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import ProductCard from "../components/ProductCard.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { getProducts } from "../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {};
        if (search) params.search = search;
        if (category) params.category = category;

        const res = await getProducts(params);
        setProducts(res.data.products);
      } catch (err) {
        setError("Something went wrong while loading products.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [search, category]);

  return (
    <div>
      <Navbar />
      <div className="page catalog">
        <h1>Products</h1>
        <SearchBar
          search={search}
          category={category}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
        />

        {loading && <p className="loading">Loading products...</p>}

        {!loading && error && <p className="error">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p className="empty">No products found.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
