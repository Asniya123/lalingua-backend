import mongoose from "mongoose";
import HttpStatusCode from "../../domain/enum/httpstatus.js";
import { CustomError } from "../../domain/errors/customError.js";
import { IChatData, IChatMsgService, IChatRepository, IConversation, IMessage } from "../../interface/IConversation.js";
import { INotification, INotificationRepository } from "../../interface/INotification.js";
import chatRepository from "../../repositories/chatRepository.js";
import notificationRepository from "../../repositories/notificationRepository.js";
import dotenv from 'dotenv';
import { IStudent } from "../../interface/IStudent.js";
import { ITutor } from "../../interface/ITutor.js";

dotenv.config();

class SocketService implements IChatMsgService{
    private chatRepository: IChatRepository
    private notificationRepository: INotificationRepository
    constructor(chatRepository: IChatRepository, notificationRepository: INotificationRepository){
        this.chatRepository = chatRepository
        this.notificationRepository = notificationRepository
    }
    getTutorChats(search: string, tutorId: string | undefined): Promise<IChatData[] | null> {
        throw new Error("Method not implemented.");
    }
    getContacts(search: string, userId: string | undefined): Promise<(IStudent | ITutor)[]> {
        throw new Error("Method not implemented.");
    }
    getChats(search: string, userId: string | undefined): Promise<IChatData[] | null> {
        throw new Error("Method not implemented.");
    }
    getRoom(recieverId: string, senderId: string): Promise<IConversation | null> {
        throw new Error("Method not implemented.");
    }
    getRoomMessage(roomId: string, userId: string): Promise<IConversation | null> {
        throw new Error("Method not implemented.");
    }

    async saveMessage(roomId: string, senderId: string, message: string, message_time: Date, message_type: string): Promise<IMessage | null> {
        try {
            const savedMessage = await this.chatRepository.saveMessage(roomId,
                senderId,
                message,
                message_time,
                message_type
            )
            if(!savedMessage){
                throw new CustomError('message not saved', HttpStatusCode.INTERNAL_SERVER_ERROR)
            }
            return savedMessage
        } catch (error) {
            throw error
        }
    }


    async saveAdminNotification(data: INotification): Promise<INotification>{
        try {
            data.to = new mongoose.Types.ObjectId(process.env.ADMIN_ID as string);
            data.toModel = 'Admin'
            const savedNotification = await this.notificationRepository.saveNotification(data);
            if(!savedNotification){
              throw new CustomError("INotification not saved",HttpStatusCode.INTERNAL_SERVER_ERROR)
            }
            return savedNotification
        } catch (error) {
            throw error
        }
    }


    async  saveNotification(data: INotification): Promise<INotification>{
        try {
            const savedNotification = await this.notificationRepository.saveNotification(data);
            if(!savedNotification){
              throw new CustomError("INotification not saved",HttpStatusCode.INTERNAL_SERVER_ERROR)
            }
            return savedNotification
        } catch (error) {
            throw error
        }
    }
}



export default new SocketService(chatRepository, notificationRepository)