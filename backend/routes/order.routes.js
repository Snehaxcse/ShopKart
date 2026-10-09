import express from "express";
import {
  createPaymentOrder,
  getOrderById,
  getOrders,
  verifyPayment,
} from "../controllers/order.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.post("/", createPaymentOrder);
router.post("/create-payment-order", createPaymentOrder);
router.post("/verify-payment", verifyPayment);
router.get("/", getOrders);
router.get("/:id", getOrderById);

export default router;
