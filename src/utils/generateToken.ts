import { Response } from "express";
import jwt from "jsonwebtoken";

export const generateTokenSetCookie = (
  userId: string,
  res: Response
): string => {
  // Generate JWT token
  const token = jwt.sign({ userId }, process.env.JWT_SECRET || "", {
    expiresIn: "30d",
  });

  // Set HTTP-only cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token;
};
