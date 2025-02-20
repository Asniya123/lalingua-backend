import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import studentRepo from "../repositories/student/studentRepo.js";

// ✅ Declare a global namespace for Express to fix `req.user` TypeScript error
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return
    }

    // ✅ Verify token and ensure it is of type JwtPayload
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    console.log("Decoded Token:", decoded);

    if (!decoded?._id) {
     res.status(400).json({ message: "Invalid token structure." });
     return
    }

    // ✅ Fetch student details from database
    const student = await studentRepo.findById(decoded._id);

    if (!student) {
       res.status(401).json({ message: "User not found." });
       return
    }

    if (student.is_blocked) {
      res.status(403).json({ message: "User is blocked by admin" });
      return
    }

    req.user = { _id: decoded._id };

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
     res.status(400).json({ message: "Invalid token." });
     return
  }
};
