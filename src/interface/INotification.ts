import { Types } from "mongoose";
import { Request, Response } from "express";

export interface INotification extends Document{
    heading: string;
    message: string;
    isRead: Boolean;
    url: string;
    from: Types.ObjectId;
    fromModel: 'User' | 'Tutor' | 'Admin';
    to?: Types.ObjectId;
    toModel?: 'User' | 'Tutor' | 'Admin';
}


export interface INotificationRepository{
    saveNotification(data: INotification): Promise<INotification | null>
    getAgentNotifications(Id: string): Promise<INotification[] | null>
    getUserNotifications(Id: string): Promise<INotification[] | null>
    getAdminNotifications(Id: string): Promise<INotification[] | null>
}


export interface INotificationService{
    gettutorNotifications(tutorId: string): Promise<INotification | null >
    getUserNotifications(userId: string): Promise<INotification[] | null>
    getAdminNotifications(adminId: string): Promise<INotification[] | null>
}



export interface INotificationController{
    getTutorNotifications(req: Request, res: Response): Promise<void>
    getUserNotifications(req: Request, res: Response): Promise<void>
    getAdminNotifications(req: Request, res: Response): Promise<void>
}