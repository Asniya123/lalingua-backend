import HttpStatusCode from "../../domain/enum/httpstatus.js";
import {INotificationController,INotificationService,} from "../../interface/INotification.js";
import { Request, Response } from "express";

export default class NotificationController implements INotificationController {
  private notificationService: INotificationService;

  constructor(notificationService: INotificationService) {
    this.notificationService = notificationService;
  }

  async getTutorNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;
      const notifications = await this.notificationService.gettutorNotifications(agentId);
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "success",
        notifications,
      });
    } catch (error) {
      throw error;
    }
  }
  
  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const notifications = await this.notificationService.getUserNotifications(userId);
  
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "success",
        notifications,
      });
    } catch (error) {
      throw error;
    }
  }
  
  async getAdminNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { adminId } = req.params;
      const notifications = await this.notificationService.getAdminNotifications(adminId);
  
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "success",
        notifications,
      });
    } catch (error) {
      throw error;
    }
  }
  
}

