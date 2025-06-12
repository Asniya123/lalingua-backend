var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoose from "mongoose";
export default class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    getTutorNotifications(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { agentId } = req.params;
                if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) {
                    throw new Error("Valid agent ID is required");
                }
                console.log(`Controller: Fetching tutor notifications for agentId: ${agentId}`);
                const notifications = yield this.notificationService.getTutorNotifications(agentId);
                res.status(200).json({
                    success: true,
                    message: "Tutor notifications fetched successfully",
                    notifications,
                });
            }
            catch (error) {
                console.error("Controller: Error in getTutorNotifications:", {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                const statusCode = error instanceof Error
                    ? error.message.includes("Invalid") || error.message.includes("required")
                        ? 400
                        : error.message.includes("not found")
                            ? 404
                            : 500
                    : 500;
                res.status(statusCode).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch tutor notifications",
                });
            }
        });
    }
    getUserNotifications(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                    throw new Error("Valid user ID is required");
                }
                console.log(`Controller: Fetching user notifications for userId: ${userId}`);
                const notifications = yield this.notificationService.getUserNotifications(userId);
                res.status(200).json({
                    success: true,
                    message: "User notifications fetched successfully",
                    notifications,
                });
            }
            catch (error) {
                console.error("Controller: Error in getUserNotifications:", {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                const statusCode = error instanceof Error
                    ? error.message.includes("Invalid") || error.message.includes("required")
                        ? 400
                        : error.message.includes("not found")
                            ? 404
                            : 500
                    : 500;
                res.status(statusCode).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch user notifications",
                });
            }
        });
    }
    getAdminNotifications(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { adminId } = req.params;
                if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
                    throw new Error("Valid admin ID is required");
                }
                console.log(`Controller: Fetching admin notifications for adminId: ${adminId}`);
                const notifications = yield this.notificationService.getAdminNotifications(adminId);
                res.status(200).json({
                    success: true,
                    message: "Admin notifications fetched successfully",
                    notifications,
                });
            }
            catch (error) {
                console.error("Controller: Error in getAdminNotifications:", {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                const statusCode = error instanceof Error
                    ? error.message.includes("Invalid") || error.message.includes("required")
                        ? 400
                        : error.message.includes("not found")
                            ? 404
                            : 500
                    : 500;
                res.status(statusCode).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch admin notifications",
                });
            }
        });
    }
    markNotificationRead(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                    throw new Error("Valid notification ID is required");
                }
                console.log(`Controller: Marking notification as read for id: ${id}`);
                const notification = yield this.notificationService.markNotificationRead(id);
                if (!notification) {
                    console.warn(`Notification not found for id: ${id}`);
                    res.status(404).json({
                        success: false,
                        message: "Notification not found",
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    message: "Notification marked as read",
                    notification,
                });
            }
            catch (error) {
                console.error("Controller: Error in markNotificationRead:", {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                const statusCode = error instanceof Error
                    ? error.message.includes("Invalid") || error.message.includes("required")
                        ? 400
                        : error.message.includes("not found")
                            ? 404
                            : 500
                    : 500;
                res.status(statusCode).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to mark notification as read",
                });
            }
        });
    }
}
