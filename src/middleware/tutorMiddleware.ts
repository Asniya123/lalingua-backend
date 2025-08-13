import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import tutorRepo from "../repositories/tutor/tutorRepo";
import dotenv from "dotenv";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      tutor?: {
        _id: string;
      };
    }
  }
}

export const tutorAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
   
    if (!token) {
      res.status(401).json({ message: "Access denied. No token provided." });
      return;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    console.log("Decoded Token:", decoded);

    if (!decoded?.id) {
      res.status(400).json({ message: "Invalid token structure." });
      return;
    }

    const tutor = await tutorRepo.findById(decoded.id);
    if (!tutor) {
      res.status(401).json({ message: "Tutor not found." });
      return;
    }

    if (tutor.is_blocked) {
      res.status(403).json({ message: "Your account has been blocked by the admin. Please contact support." });
      return;
    }

    req.tutor = { _id: decoded.id };
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired. Please log in again." });
    } else {
      res.status(401).json({ message: "Invalid token." });
    }
    return;
  }
};


