import HttpStatusCode from "../../domain/enum/httpstatus.js";
import { CustomError } from "../../domain/errors/customError.js";
import { IChatRepository,IMessage, ISocketService } from "../../interface/IConversation.js";
import { INotificationRepository } from "../../interface/INotification.js";
import chatRepository from "../../repositories/chatRepository.js";
import dotenv from 'dotenv';


dotenv.config();

class SocketService implements ISocketService{
    private chatRepository: IChatRepository
    // private notificationRepository: INotificationRepository
    constructor(chatRepository: IChatRepository){
        this.chatRepository = chatRepository
        // this.notificationRepository = notificationRepository
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

}
    // async saveAdminNotification(data: INotification): Promise<INotification>{
    //     try {
    //         data.to = new mongoose.Types.ObjectId(process.env.ADMIN_ID as string);
    //         data.toModel = 'Admin'
    //         const savedNotification = await this.notificationRepository.saveNotification(data);
    //         if(!savedNotification){
    //           throw new CustomError("INotification not saved",HttpStatusCode.INTERNAL_SERVER_ERROR)
    //         }
    //         return savedNotification
    //     } catch (error) {
    //         throw error
    //     }
    // }


//     async  saveNotification(data: INotification): Promise<INotification>{
//         try {
//             const savedNotification = await this.notificationRepository.saveNotification(data);
//             if(!savedNotification){
//               throw new CustomError("INotification not saved",HttpStatusCode.INTERNAL_SERVER_ERROR)
//             }
//             return savedNotification
//         } catch (error) {
//             throw error
//         }
//     }
// }



export default new SocketService(chatRepository)