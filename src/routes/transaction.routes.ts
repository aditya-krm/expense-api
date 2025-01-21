import { Router } from "express";
import { validateAuth } from "../middlewares/auth.middleware";
import {
  createTransaction,
  getTransactions,
  getStatistics,
  getTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller";

const router = Router();

// All routes are protected
router.use(validateAuth);

// Transaction routes
router.post("/", createTransaction);
router.get("/", getTransactions);
router.get("/statistics", getStatistics);
router.get("/:id", getTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
