import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import adminRepository from "../repositories/admin/adminRepository.js";
import dotenv from "dotenv";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      admin?: {
        _id: string;
        role?: string; 
      };
    }
  }
}

export const adminAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
      res.status(401).json({ success: false, message: "Access denied. No token provided" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    console.log("Decoded Token:", decoded);

    if (!decoded?.id || decoded.role !== "admin") {
      res.status(400).json({ success: false, message: "Invalid token structure or role" });
      return;
    }

    const admin = await adminRepository.findByEmail(decoded.id);
    if (!admin) {
      res.status(401).json({ success: false, message: "Admin not found" });
      return;
    }

    req.admin = { _id: decoded.id, role: "admin" };
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: "Token expired. Please log in again" });
    } else {
      res.status(401).json({ success: false, message: "Invalid token" });
    }
    return;
  }
};