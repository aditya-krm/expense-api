import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, signup } from "../controllers/auth.controller";
import { validateAuth } from "../middlewares/auth.middleware";

const router = Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

// Public routes with rate limiting
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);

// Protected routes
router.post("/logout", validateAuth, logout);

export default router;
