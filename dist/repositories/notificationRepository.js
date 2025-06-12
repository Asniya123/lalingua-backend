var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import NotificationModel from "../models/notificationModel.js";
import { Types } from "mongoose";
class NotificationRepository {
    saveNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notificationData = Object.assign(Object.assign({}, data), { from: new Types.ObjectId(data.from), to: data.to ? new Types.ObjectId(data.to) : undefined });
                const savedNotification = yield NotificationModel.create(notificationData);
                return savedNotification.toObject();
            }
            catch (error) {
                throw new Error(`Failed to save notification: ${error}`);
            }
        });
    }
    getTutorNotifications(Id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notifications = yield NotificationModel.find({
                    $or: [
                        { to: new Types.ObjectId(Id), toModel: "Tutor" },
                        { to: null, toModel: "Tutor" },
                    ],
                })
                    .populate("from")
                    .lean();
                return notifications;
            }
            catch (error) {
                throw new Error(`Failed to fetch tutor notifications: ${error}`);
            }
        });
    }
    getUserNotifications(Id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notifications = yield NotificationModel.find({
                    $or: [
                        { to: new Types.ObjectId(Id), toModel: "User" },
                        { to: null, toModel: "User" },
                    ],
                })
                    .populate("from")
                    .lean();
                return notifications;
            }
            catch (error) {
                throw new Error(`Failed to fetch user notifications: ${error}`);
            }
        });
    }
    getAdminNotifications(Id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notifications = yield NotificationModel.find({
                    $or: [
                        { to: new Types.ObjectId(Id), toModel: "Admin" },
                        { to: null, toModel: "Admin" },
                    ],
                })
                    .populate("from")
                    .lean();
                return notifications;
            }
            catch (error) {
                throw new Error(`Failed to fetch admin notifications: ${error}`);
            }
        });
    }
    markNotificationRead(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notification = yield NotificationModel.findByIdAndUpdate(id, { isRead: true }, { new: true }).lean();
                return notification ? notification : null;
            }
            catch (error) {
                throw new Error(`Failed to mark notification as read: ${error}`);
            }
        });
    }
}
export default new NotificationRepository();
