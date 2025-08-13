import { INotification, INotificationRepository, INotificationService } from "../../interface/INotification";
import notificationRepository from "../../repositories/notificationRepository";

class NotificationService implements INotificationService {
  private notificationRepository: INotificationRepository;

  constructor(notificationRepository: INotificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async saveNotification(data: INotification): Promise<INotification | null> {
    try {
      return await this.notificationRepository.saveNotification(data);
    } catch (error) {
      throw new Error(`Failed to save notification: ${error}`);
    }
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

  async markNotificationRead(id: string): Promise<INotification | null> {
    try {
      return await this.notificationRepository.markNotificationRead(id);
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error}`);
    }
  }
}

export default new NotificationService(notificationRepository);