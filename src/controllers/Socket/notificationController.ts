import { INotificationController, INotificationService } from "../../interface/INotification";
import { Request, Response } from "express";
import mongoose from "mongoose";

export default class NotificationController implements INotificationController {
  private notificationService: INotificationService;

  constructor(notificationService: INotificationService) {
    this.notificationService = notificationService;
  }

  async saveNotification(req: Request, res: Response): Promise<void> {
    try {
      const { heading, message, from, fromModel, to, toModel, roomId } = req.body;

      if (!heading || !message || !from || !fromModel || !to || !toModel) {
        throw new Error("Missing required fields");
      }

      if (!mongoose.Types.ObjectId.isValid(from) || !mongoose.Types.ObjectId.isValid(to)) {
        throw new Error("Invalid from or to ID");
      }

      const notification = await this.notificationService.saveNotification({
        heading,
        message,
        from,
        fromModel,
        to,
        toModel,
        roomId,
        isRead: false,
      });

      res.status(201).json({
        success: true,
        message: "Notification created successfully",
        notification,
      });
    } catch (error) {
      console.error("Controller: Error in saveNotification:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      const statusCode = error instanceof Error
        ? error.message.includes("Invalid") || error.message.includes("required")
          ? 400
          : 500
        : 500;

      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create notification",
      });
    }
  }

  async getTutorNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { agentId } = req.params;

      if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) {
        throw new Error("Valid agent ID is required");
      }

      console.log(`Controller: Fetching tutor notifications for agentId: ${agentId}`);
      const notifications = await this.notificationService.getTutorNotifications(agentId);
      res.status(200).json({
        success: true,
        message: "Tutor notifications fetched successfully",
        notifications,
      });
    } catch (error) {
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
  }

  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Valid user ID is required");
      }

      console.log(`Controller: Fetching user notifications for userId: ${userId}`);
      const notifications = await this.notificationService.getUserNotifications(userId);
      res.status(200).json({
        success: true,
        message: "User notifications fetched successfully",
        notifications,
      });
    } catch (error) {
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
  }

  async markNotificationRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Valid notification ID is required");
      }

      console.log(`Controller: Marking notification as read for id: ${id}`);
      const notification = await this.notificationService.markNotificationRead(id);
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
    } catch (error) {
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
  }
}