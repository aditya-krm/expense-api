import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

// Validation schemas
const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "CREDIT_GIVEN", "CREDIT_RECEIVED"]),
  category: z.string(),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be positive"),
  date: z.coerce.date().default(() => new Date()),
  description: z.string().min(2, "Description must be at least 2 characters"),
  paymentMode: z.enum(["ONLINE", "CASH"]),
  recurrence: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  relatedTo: z.string().optional(),
  isPaid: z.boolean().optional(),
});

// TODO: add a schema for budgeting and maintain a balance for each month to track spending and other things

// Create transaction
export const createTransaction = async (req: Request, res: Response) => {
  console.log(req);
  try {
    const validatedData = transactionSchema.parse(req.body);
    const userId = req.user.id;

    const transaction = await prisma.transaction.create({
      data: {
        ...validatedData,
        userId,
        date: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Get all transactions with filters
export const getTransactions = async (req: Request, res: Response) => {
  console.log(req.query);
  try {
    const {
      type,
      startDate,
      endDate,
      category,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const where: any = {
      userId: req.user.id,
    };

    if (type) {
      where.type = type;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (category) {
      where.category = {
        contains: category as string,
        mode: "insensitive",
      };
    }

    if (search) {
      where.OR = [
        { description: { contains: search as string, mode: "insensitive" } },
        { category: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: {
          date: "desc",
        },
        skip,
        take: Number(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Get transaction statistics
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      userId: req.user.id,
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const stats = await prisma.transaction.groupBy({
      by: ["type"],
      where,
      _sum: {
        amount: true,
      },
    });

    const totalIncome = Number(
      stats.find((s) => s.type === "INCOME")?._sum?.amount || 0
    );
    const totalExpense = Number(
      stats.find((s) => s.type === "EXPENSE")?._sum?.amount || 0
    );
    const totalCreditGiven = Number(
      stats.find((s) => s.type === "CREDIT_GIVEN")?._sum?.amount || 0
    );
    const totalCreditReceived = Number(
      stats.find((s) => s.type === "CREDIT_RECEIVED")?._sum?.amount || 0
    );

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        totalCreditGiven,
        totalCreditReceived,
        balance: totalIncome - totalExpense,
        netCredit: totalCreditGiven - totalCreditReceived,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = transactionSchema.parse(req.body);

    const transaction = await prisma.transaction.update({
      where: {
        id,
        userId: req.user.id,
      },
      data: {
        ...validatedData,
        amount: new Decimal(validatedData.amount),
      },
    });

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.transaction.delete({
      where: {
        id,
        userId: req.user.id,
      },
    });

    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
