import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  hi,
} from "../controllers/customer.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.get("/hi", hi);

export default router;
