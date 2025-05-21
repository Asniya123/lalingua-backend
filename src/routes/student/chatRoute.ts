import { Request, Response, Router }  from "express";
import { authenticate } from "../../middleware/authMiddleware.js";
import ChatMsgController from "../../controllers/Socket/chatController.js";
import chatMessage from "../../service/UseCase/chatService.js";


const router = Router()


const chatController = new ChatMsgController(chatMessage)

router.get('/chat/contacts/:userId', authenticate, chatController.getContacts.bind(chatController))
router.get('/chat/chats/:userId', authenticate, chatController.getChats.bind(chatController))
router.get('/chat/room/:receiverId/:senderId', authenticate, chatController.getRoom.bind(chatController))
router.get('/chat/room-message/:roomId/:userId', authenticate, chatController.getRoomMessage.bind(chatController))


export default router