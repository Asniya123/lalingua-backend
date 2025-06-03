import { IChatRepository, IMessage, ISocketService } from "../../interface/IConversation.js";
import { INotificationRepository } from "../../interface/INotification.js";
import chatRepository from "../../repositories/chatRepository.js";
import dotenv from 'dotenv';

dotenv.config();

class SocketService implements ISocketService {
    private chatRepository: IChatRepository;
    // private notificationRepository: INotificationRepository

    constructor(chatRepository: IChatRepository) {
        this.chatRepository = chatRepository;
        // this.notificationRepository = notificationRepository
    }

    async saveMessage(roomId: string, senderId: string, message: string, message_time: Date, message_type: string): Promise<IMessage | null> {
        try {
            const savedMessage = await this.chatRepository.saveMessage(
                roomId,
                senderId,
                message,
                message_time,
                message_type
            );

            if (!savedMessage) {
                throw new Error('Failed to save message. Internal Server Error (500)');
            }

            return savedMessage;
        } catch (error) {
            console.error('Error in saveMessage:', error);
            throw new Error('An error occurred while saving the message.');
        }
    }

    // Uncomment and modify if notification logic is needed
    // async saveNotification(data: INotification): Promise<INotification> {
    //     try {
    //         const savedNotification = await this.notificationRepository.saveNotification(data);
    //         if (!savedNotification) {
    //             throw new Error('Failed to save notification. Internal Server Error (500)');
    //         }
    //         return savedNotification;
    //     } catch (error) {
    //         console.error('Error in saveNotification:', error);
    //         throw new Error('An error occurred while saving the notification.');
    //     }
    // }
}

export default new SocketService(chatRepository);
