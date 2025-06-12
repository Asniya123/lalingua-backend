var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import notificationRepository from "../../repositories/notificationRepository.js";
class NotificationService {
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    getTutorNotifications(tutorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.notificationRepository.getTutorNotifications(tutorId);
            }
            catch (error) {
                throw new Error(`Failed to fetch tutor notifications: ${error}`);
            }
        });
    }
    getUserNotifications(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.notificationRepository.getUserNotifications(userId);
            }
            catch (error) {
                throw new Error(`Failed to fetch user notifications: ${error}`);
            }
        });
    }
    getAdminNotifications(adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.notificationRepository.getAdminNotifications(adminId);
            }
            catch (error) {
                throw new Error(`Failed to fetch admin notifications: ${error}`);
            }
        });
    }
    markNotificationRead(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.notificationRepository.markNotificationRead(id);
            }
            catch (error) {
                throw new Error(`Failed to mark notification as read: ${error}`);
            }
        });
    }
}
export default new NotificationService(notificationRepository);
