var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import chatRepository from "../../repositories/chatRepository.js";
import dotenv from 'dotenv';
dotenv.config();
class SocketService {
    // private notificationRepository: INotificationRepository
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
        // this.notificationRepository = notificationRepository
    }
    saveMessage(roomId, senderId, message, message_time, message_type) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const savedMessage = yield this.chatRepository.saveMessage(roomId, senderId, message, message_time, message_type);
                if (!savedMessage) {
                    throw new Error('Failed to save message. Internal Server Error (500)');
                }
                return savedMessage;
            }
            catch (error) {
                console.error('Error in saveMessage:', error);
                throw new Error('An error occurred while saving the message.');
            }
        });
    }
}
export default new SocketService(chatRepository);
