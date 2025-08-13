import {  Router } from "express";
import {  tutorAuthenticate } from "../../middleware/tutorMiddleware";
import TutorChatMsgController from "../../controllers/Socket/tutorChatMsgController";
import chatMessage from "../../service/UseCase/chatService";


const router = Router();

const tutorChatMsgController = new TutorChatMsgController(chatMessage)

//Chat
router.get('/chat/chats/:tutorId', tutorChatMsgController.getChats.bind(tutorChatMsgController))
router.get('/chat/room/:receiverId/:senderId',tutorChatMsgController.getRoom.bind(tutorChatMsgController))
router.get('/chat/room-message/:roomId/:tutorId', tutorChatMsgController.getRoomMessage.bind(tutorChatMsgController))


export default router;