import { Request, Response } from "express";

export interface INotification {
  _id?: string;
  heading: string;
  message: string;
  isRead: boolean;
  url?: string;
  from?: string; 
  fromModel: "User" | "Tutor" | "Admin";
  to?: string;
  toModel?: "User" | "Tutor" | "Admin";
}

export interface INotificationRepository {
  saveNotification(data: INotification): Promise<INotification | null>;
  getTutorNotifications(Id: string): Promise<INotification[] | null>;
  getUserNotifications(Id: string): Promise<INotification[] | null>;
  getAdminNotifications(Id: string): Promise<INotification[] | null>;
  markNotificationRead(id: string): Promise<INotification | null>;
}

export interface INotificationService {
  getTutorNotifications(tutorId: string): Promise<INotification[] | null>; 
  getUserNotifications(userId: string): Promise<INotification[] | null>;
  getAdminNotifications(adminId: string): Promise<INotification[] | null>;
  markNotificationRead(id: string): Promise<INotification | null>;
}

export interface INotificationController {
  getTutorNotifications(req: Request, res: Response): Promise<void>
  getUserNotifications(req: Request, res: Response): Promise<void>;
  getAdminNotifications(req: Request, res: Response): Promise<void>;
  markNotificationRead(req: Request, res: Response): Promise<void>;
}