import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
} from "../controllers/cart.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getCart);
router.post("/:productId", addToCart);
router.patch("/:productId", updateCartItemQuantity);
router.delete("/:productId", removeFromCart);

export default router;
