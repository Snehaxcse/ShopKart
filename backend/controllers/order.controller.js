import crypto from "crypto";
import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { createRazorpayInstance } from "../config/razorpay.js";

const normalizeShippingAddress = (address = {}) => ({
  fullName: String(address.fullName || "").trim(),
  phone: String(address.phone || "").trim(),
  addressLine1: String(address.addressLine1 || "").trim(),
  city: String(address.city || "").trim(),
  state: String(address.state || "").trim(),
  pincode: String(address.pincode || "").trim(),
});

const validateShippingAddress = (address = {}) => {
  const normalized = normalizeShippingAddress(address);
  const requiredFields = [
    ["fullName", "Full Name"],
    ["phone", "Phone number"],
    ["addressLine1", "Address"],
    ["city", "City"],
    ["state", "State"],
    ["pincode", "Pincode"],
  ];

  for (const [field, label] of requiredFields) {
    if (!normalized[field]) {
      return {
        valid: false,
        message: `${label} is required.`,
      };
    }
  }

  if (!/^[0-9+\-\s()]{10,15}$/.test(normalized.phone)) {
    return {
      valid: false,
      message: "Phone number is invalid.",
    };
  }

  if (!/^\d{6}$/.test(normalized.pincode)) {
    return {
      valid: false,
      message: "Pincode must contain 6 digits.",
    };
  }

  return {
    valid: true,
    payload: normalized,
  };
};

const buildOrderSnapshot = (cartItems, productMap) => {
  const items = [];
  let totalAmount = 0;

  for (const item of cartItems) {
    const productId = item.product?.toString();
    const product = productMap.get(productId);
    const quantity = Number(item.quantity || 0);

    if (!product) {
      throw new Error("One or more products in your cart are no longer available.");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error(`Invalid quantity for ${product.name}.`);
    }

    if (quantity > Number(product.stock || 0)) {
      throw new Error(`Insufficient stock for ${product.name}.`);
    }

    const itemPrice = Number(product.price || 0);
    items.push({
      product: product._id,
      name: product.name,
      price: itemPrice,
      quantity,
      image: product.image,
    });
    totalAmount += itemPrice * quantity;
  }

  return { items, totalAmount };
};

const isClientError = (message = "") =>
  /Cart is empty|Insufficient stock|no longer available|Invalid shipping|Pincode must contain 6 digits|Phone number is invalid|One or more products|required\.|is required/i.test(message);

export const createPaymentOrder = async (req, res) => {
  try {
    const shippingAddress = req.body.shippingAddress || req.body;
    const validation = validateShippingAddress(shippingAddress);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const customer = await Customer.findById(req.user._id);
    const cart = Array.isArray(customer?.cart) ? customer.cart : [];

    if (cart.length === 0) {
      throw new Error("Cart is empty.");
    }

    const productIds = cart.map((cartItem) => cartItem.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    const { items, totalAmount } = buildOrderSnapshot(cart, productMap);
    const razorpay = createRazorpayInstance();

    const order = await Order.create({
      user: customer._id,
      items,
      shippingAddress: validation.payload,
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: String(order._id),
        notes: {
          shopkartOrderId: String(order._id),
        },
      });
    } catch (error) {
      await Order.deleteOne({ _id: order._id });
      console.error("Razorpay order creation failed:", error.message);
      return res.status(502).json({
        success: false,
        message:
          "Razorpay could not create the payment order. Check the backend Test Mode credentials and try again.",
      });
    }

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully.",
      order,
      shopkartOrderId: order._id,
      razorpay: {
        key: process.env.RAZORPAY_KEY_ID,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    });
  } catch (error) {
    const message = error.message || "Unable to create payment order.";

    if (message === "Razorpay credentials are missing.") {
      return res.status(503).json({
        success: false,
        message:
          "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env using Test Mode keys, then restart the backend.",
      });
    }

    if (isClientError(message)) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    console.error("Payment order creation failed:", message);
    return res.status(500).json({
      success: false,
      message: "Unable to create payment order.",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification data is incomplete.",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      order.paymentStatus = "FAILED";
      order.status = "PENDING_PAYMENT";
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Your cart has not been cleared.",
      });
    }

    if (order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order id does not match this order.",
      });
    }

    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paymentStatus = "PAID";
    order.status = "PLACED";
    await order.save();

    const customer = await Customer.findById(req.user._id);
    customer.cart = [];
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to verify payment.",
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load orders.",
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user._id,
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load order.",
    });
  }
};
