
import { INotification, INotificationRepository, INotificationService } from "../../interface/INotification.js";
import notificationRepository from "../../repositories/notificationRepository.js";

class NotificationService implements INotificationService {
  private notificationRepository: INotificationRepository;

  constructor(notificationRepository: INotificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async getTutorNotifications(tutorId: string): Promise<INotification[] | null> {
    try {
      return await this.notificationRepository.getTutorNotifications(tutorId);
    } catch (error) {
      throw new Error(`Failed to fetch tutor notifications: ${error}`);
    }
  }

  async getUserNotifications(userId: string): Promise<INotification[] | null> {
    try {
      return await this.notificationRepository.getUserNotifications(userId);
    } catch (error) {
      throw new Error(`Failed to fetch user notifications: ${error}`);
    }
  }

  async getAdminNotifications(adminId: string): Promise<INotification[] | null> {
    try {
      return await this.notificationRepository.getAdminNotifications(adminId);
    } catch (error) {
      throw new Error(`Failed to fetch admin notifications: ${error}`);
    }
  }

  async markNotificationRead(id: string): Promise<INotification | null> {
    try {
      return await this.notificationRepository.markNotificationRead(id);
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error}`);
    }
  }
}

export default new NotificationService(notificationRepository);