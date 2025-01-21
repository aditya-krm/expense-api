import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schemas
const categorySchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  type: z.enum(["INCOME", "EXPENSE", "CREDIT_GIVEN", "CREDIT_RECEIVED"]),
  icon: z.string().optional(),
});

// Create category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const validatedData = categorySchema.parse(req.body);

    // Check if category with same title and type exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        title: validatedData.title,
        type: validatedData.type,
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this title and type already exists",
      });
    }

    const category = await prisma.category.create({
      data: validatedData,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    console.error("Category creation error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    const where = type
      ? {
          type: type as string,
        }
      : {};

    const categories = await prisma.category.findMany({});

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Get single category
export const getCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        transactions: true,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Update category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = categorySchema.partial().parse(req.body);

    const category = await prisma.category.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }

    console.error("Update category error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// Delete category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category has transactions
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (category._count.transactions > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category with existing transactions",
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
