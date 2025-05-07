import { INotification, INotificationRepository, INotificationService } from "../../interface/INotification.js";
import notificationRepository from "../../repositories/notificationRepository.js";

class NotificationService implements INotificationService{
    private notificationRepository: INotificationRepository

    constructor(notificationRepository: INotificationRepository){
        this.notificationRepository = notificationRepository
    }
    gettutorNotifications(tutorId: string): Promise<INotification | null> {
        throw new Error("Method not implemented.");
    }

    async getTutorNotifications(tutorId: string): Promise<INotification[] | null> {
        try {
            const notifications = await this.notificationRepository.getAgentNotifications(tutorId);
            return notifications;
        } catch (error) {
            throw error;
        }
    }
    
    async getUserNotifications(userId: string): Promise<INotification[] | null> {
        try {
            const notifications = await this.notificationRepository.getUserNotifications(userId);
            return notifications;
        } catch (error) {
            throw error;
        }
    }
    
    async getAdminNotifications(adminId: string): Promise<INotification[] | null> {
        try {
            const notifications = await this.notificationRepository.getAdminNotifications(adminId);
            return notifications;
        } catch (error) {
            throw error;
        }
    }
    
}


export default new NotificationService(notificationRepository)