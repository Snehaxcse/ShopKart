import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";

const wishlistFields = "_id name price category image stock";

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(productId).select("_id");
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const wishlist = req.user.wishlist || [];

    if (wishlist.some((id) => id.toString() === productId)) {
      return res
        .status(409)
        .json({ success: false, message: "Product already in wishlist" });
    }

    wishlist.push(product._id);
    req.user.wishlist = wishlist;
    await req.user.save();

    return res
      .status(201)
      .json({ success: true, message: "Product added to wishlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: wishlistFields,
    });

    if (!customer) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    }

    return res.status(200).json({
      success: true,
      count: customer.wishlist.length,
      wishlist: customer.wishlist,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    const wishlist = req.user.wishlist || [];
    const wishlistIndex = wishlist.findIndex(
      (id) => id.toString() === productId,
    );

    if (wishlistIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not in wishlist",
      });
    }

    wishlist.splice(wishlistIndex, 1);
    req.user.wishlist = wishlist;
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
