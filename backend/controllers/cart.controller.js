import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";

const cartProductFields = "_id name price category image stock";

const populateCart = async (customerId) => {
  return Customer.findById(customerId).populate({
    path: "cart.product",
    select: cartProductFields,
  });
};

export const getCart = async (req, res) => {
  try {
    const customer = await populateCart(req.user._id);

    return res.status(200).json({
      success: true,
      cart: customer?.cart || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load cart",
    });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const cart = Array.isArray(req.user.cart) ? [...req.user.cart] : [];
    const existingItem = cart.find(
      (item) => item.product && item.product.toString() === productId,
    );

    if (existingItem) {
      const nextQuantity = existingItem.quantity + 1;

      if (nextQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: "Requested quantity exceeds available stock",
        });
      }

      existingItem.quantity = nextQuantity;
    } else {
      if (product.stock < 1) {
        return res.status(400).json({
          success: false,
          message: "Product is out of stock",
        });
      }

      cart.push({
        product: product._id,
        quantity: 1,
      });
    }

    req.user.cart = cart;
    await req.user.save();

    const updatedCustomer = await populateCart(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      cart: updatedCustomer?.cart || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to update cart",
    });
  }
};

export const updateCartItemQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const cart = Array.isArray(req.user.cart) ? [...req.user.cart] : [];
    const existingItem = cart.find(
      (item) => item.product && item.product.toString() === productId,
    );

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
    }

    existingItem.quantity = quantity;
    req.user.cart = cart;
    await req.user.save();

    const updatedCustomer = await populateCart(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      cart: updatedCustomer?.cart || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to update cart",
    });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const cart = Array.isArray(req.user.cart) ? [...req.user.cart] : [];
    const itemIndex = cart.findIndex(
      (item) => item.product && item.product.toString() === productId,
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }

    cart.splice(itemIndex, 1);
    req.user.cart = cart;
    await req.user.save();

    const updatedCustomer = await populateCart(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: updatedCustomer?.cart || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to remove product from cart",
    });
  }
};
