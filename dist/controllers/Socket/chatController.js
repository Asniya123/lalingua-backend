var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { isString } from "../Admin/adminController.js";
export default class ChatMsgController {
    constructor(chatMsgService) {
        this.chatMsgService = chatMsgService;
    }
    getContacts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const search = isString(req.query.search) ? req.query.search : "";
                const { userId } = req.params;
                if (!userId) {
                    throw new Error("User ID is required");
                }
                const users = yield this.chatMsgService.getContacts(search, userId);
                res.status(200).json({
                    success: true,
                    message: "Contacts Fetched",
                    users,
                });
            }
            catch (error) {
                console.error(`Error in getContacts: ${error instanceof Error ? error.message : String(error)}`);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch contacts",
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    getChats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const search = isString(req.query.search) ? req.query.search : "";
                const { userId } = req.params;
                if (!userId) {
                    throw new Error("User ID is required");
                }
                console.log("Calling chatMsgService.getChats with userId:", userId, "search:", search);
                const users = yield this.chatMsgService.getChats(search, userId);
                console.log("chatMsgService.getChats response:", users);
                res.status(200).json({
                    success: true,
                    message: "Chats Fetched",
                    users,
                });
            }
            catch (error) {
                console.error(`Error in getChats: ${error instanceof Error ? error.message : String(error)}`);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch chats",
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
    getRoom(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { receiverId, senderId } = req.params;
                console.log(`Controller: getRoom called with receiverId: ${receiverId}, senderId: ${senderId}`);
                if (!receiverId || !senderId) {
                    throw new Error("Receiver ID and Sender ID are required");
                }
                const room = yield this.chatMsgService.getRoom(receiverId, senderId);
                res.status(200).json({
                    success: true,
                    message: room ? "Room Fetched" : "Room Created",
                    room,
                });
            }
            catch (error) {
                console.error("Controller: Error in getRoom:", {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                res.status(500).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch room",
                });
            }
        });
    }
    getRoomMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { roomId, userId } = req.params;
            try {
                console.log(`Controller: getRoomMessage called with roomId: ${roomId}, userId: ${userId}`);
                if (!roomId || !userId) {
                    throw new Error("Room ID and User ID are required");
                }
                const room = yield this.chatMsgService.getRoomMessage(roomId, userId);
                res.status(200).json({
                    success: true,
                    message: "Room Messages Fetched",
                    room,
                });
            }
            catch (error) {
                console.error(`Error in getRoomMessage for roomId: ${roomId}, userId: ${userId}:`, error);
                res.status(500).json({
                    success: false,
                    message: "Failed to fetch room messages",
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        });
    }
}
