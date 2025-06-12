var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from "jsonwebtoken";
import tutorRepo from "../repositories/tutor/tutorRepo.js";
import dotenv from "dotenv";
dotenv.config();
export const tutorAuthenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.header("Authorization")) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "Access denied. No token provided." });
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded);
        if (!(decoded === null || decoded === void 0 ? void 0 : decoded.id)) {
            res.status(400).json({ message: "Invalid token structure." });
            return;
        }
        const tutor = yield tutorRepo.findById(decoded.id);
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
    }
    catch (error) {
        console.error("JWT Verification Error:", error);
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: "Token expired. Please log in again." });
        }
        else {
            res.status(401).json({ message: "Invalid token." });
        }
        return;
    }
});
