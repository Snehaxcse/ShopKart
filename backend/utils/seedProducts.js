import Product from "../models/product.model.js";

const sampleProducts = [
  {
    name: "Mechanical Keyboard",
    description: "RGB mechanical keyboard with blue switches.",
    price: 2999,
    category: "Electronics",
    image: "https://picsum.photos/seed/keyboard/600/400",
    stock: 10,
  },
  {
    name: "Noise Cancelling Headphones",
    description: "Wireless over-ear headphones with active noise cancellation.",
    price: 4999,
    category: "Electronics",
    image: "https://picsum.photos/seed/headphones/600/400",
    stock: 25,
  },
  {
    name: "Cotton T-Shirt",
    description: "Soft cotton t-shirt for everyday wear.",
    price: 799,
    category: "Fashion",
    image: "https://picsum.photos/seed/tshirt/600/400",
    stock: 40,
  },
  {
    name: "Mystery Novel",
    description: "A page-turner mystery for weekend reading.",
    price: 399,
    category: "Books",
    image: "https://picsum.photos/seed/book/600/400",
    stock: 15,
  },
  {
    name: "Table Lamp",
    description: "Warm LED table lamp for study and bedside use.",
    price: 1299,
    category: "Home",
    image: "https://picsum.photos/seed/lamp/600/400",
    stock: 8,
  },
];

export const seedProducts = async () => {
  const count = await Product.countDocuments();
  if (count > 0) return;
  await Product.insertMany(sampleProducts);
};
