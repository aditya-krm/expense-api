// src/routes/category.routes.ts

import { Router } from "express";
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { validateAuth } from "../middlewares/auth.middleware";

const router = Router();

// Protect all category routes
router.use(validateAuth);

// Category routes
router.post("/", createCategory);
router.get("/", getCategories);
router.get("/:id", getCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
