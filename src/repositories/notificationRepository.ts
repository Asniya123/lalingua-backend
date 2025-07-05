import { INotification, INotificationRepository } from "../interface/INotification.js";
import NotificationModel from "../models/notificationModel.js";
import { Types } from "mongoose";

class NotificationRepository implements INotificationRepository {
  async saveNotification(data: INotification): Promise<INotification | null> {
    try {
  
      const notificationData = {
        ...data,
        from: new Types.ObjectId(data.from),
        to: data.to ? new Types.ObjectId(data.to) : undefined,
      };
      const savedNotification = await NotificationModel.create(notificationData);
      return savedNotification.toObject() as INotification;
    } catch (error) {
      throw new Error(`Failed to save notification: ${error}`);
    }
  }

  async getTutorNotifications(Id: string): Promise<INotification[] | null> {
    try {
      const notifications = await NotificationModel.find({
        $or: [
          { to: new Types.ObjectId(Id), toModel: "Tutor" },
          { to: null, toModel: "Tutor" },
        ],
      })
        .populate("from")
        .lean();
      return notifications as INotification[];
    } catch (error) {
      throw new Error(`Failed to fetch tutor notifications: ${error}`);
    }
  }

  async getUserNotifications(Id: string): Promise<INotification[] | null> {
    try {
      const notifications = await NotificationModel.find({
        $or: [
          { to: new Types.ObjectId(Id), toModel: "User" },
          { to: null, toModel: "User" },
        ],
      })
        .populate("from")
        .lean();
      return notifications as INotification[];
    } catch (error) {
      throw new Error(`Failed to fetch user notifications: ${error}`);
    }
  }

  async getAdminNotifications(Id: string): Promise<INotification[] | null> {
    try {
      const notifications = await NotificationModel.find({
        $or: [
          { to: new Types.ObjectId(Id), toModel: "Admin" },
          { to: null, toModel: "Admin" },
        ],
      })
        .populate("from")
        .lean();
      return notifications as INotification[];
    } catch (error) {
      throw new Error(`Failed to fetch admin notifications: ${error}`);
    }
  }

  async markNotificationRead(id: string): Promise<INotification | null> {
    try {
      const notification = await NotificationModel.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true }
      ).lean();
      return notification ? (notification as INotification) : null;
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error}`);
    }
  }
}

export default new NotificationRepository();