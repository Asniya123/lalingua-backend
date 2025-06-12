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
import studentRepo from "../repositories/student/studentRepo.js";
export const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const student = yield studentRepo.findById(decoded.id);
        if (!student) {
            res.status(403).json({ message: "User not found." });
            return;
        }
        if (student.is_blocked) {
            res.status(403).json({ message: "User is blocked by admin" });
            return;
        }
        req.user = { _id: decoded.id };
        next();
    }
    catch (error) {
        console.error("JWT Verification Error:", error);
        res.status(401).json({ message: "Invalid token." });
        return;
    }
});
