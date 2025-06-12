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
import mongoose from "mongoose";
export default class TutorChatController {
    constructor(chatMsgService) {
        this.chatMsgService = chatMsgService;
    }
    getContacts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const search = isString(req.query.search) ? req.query.search : "";
                const { tutorId } = req.params;
                if (!tutorId || !mongoose.Types.ObjectId.isValid(tutorId)) {
                    throw new Error("Valid tutor ID is required");
                }
                console.log(`Controller: Fetching contacts for tutorId: ${tutorId}, search: ${search}`);
                const users = yield this.chatMsgService.getContacts(search, tutorId);
                res.status(200).json({
                    success: true,
                    message: "Contacts Fetched",
                    users,
                });
            }
            catch (error) {
                console.error("Controller: Error in getContacts:", {
                    message: error instanceof Error ? error.message : String(error),
                    tutorId: req.params.tutorId,
                    search: req.query.search,
                    stack: error instanceof Error ? error.stack : undefined,
                });
                const statusCode = error instanceof Error
                    ? error.message.includes("Invalid") || error.message.includes("required")
                        ? 400
                        : error.message.includes("not found")
                            ? 404
                            : 500
                    : 500;
                res.status(statusCode).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch contacts",
                });
            }
        });
    }
    getChats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const search = isString(req.query.search) ? req.query.search : "";
                const { tutorId } = req.params;
                if (!tutorId || !mongoose.Types.ObjectId.isValid(tutorId)) {
                    throw new Error("Valid tutor ID is required");
                }
                console.log(`Controller: Fetching chats for tutorId: ${tutorId}, search: ${search}`);
                const users = yield this.chatMsgService.getTutorChats(search, tutorId);
                console.log(`Controller: getTutorChats response:`, JSON.stringify(users, null, 2));
                res.status(200).json({
                    success: true,
                    message: "Tutor Chats Fetched",
                    users,
                });
            }
            catch (error) {
                console.error("Controller: Error in getChats:", {
                    message: error instanceof Error ? error.message : String(error),
                    tutorId: req.params.tutorId,
                    search: req.query.search,
                    stack: error instanceof Error ? error.stack : undefined,
                });
                const statusCode = error instanceof Error
                    ? error.message.includes("Invalid") || error.message.includes("required")
                        ? 400
                        : error.message.includes("not found")
                            ? 404
                            : 500
                    : 500;
                res.status(statusCode).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch tutor chats",
                });
            }
        });
    }
    getRoom(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { receiverId, senderId } = req.params;
                if (!receiverId ||
                    !mongoose.Types.ObjectId.isValid(receiverId) ||
                    !senderId ||
                    !mongoose.Types.ObjectId.isValid(senderId)) {
                    throw new Error("Valid receiver ID and sender ID are required");
                }
                console.log(`Controller: Fetching room for receiverId: ${receiverId}, senderId: ${senderId}`);
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
                    receiverId: req.params.receiverId,
                    senderId: req.params.senderId,
                    stack: error instanceof Error ? error.stack : undefined,
                });
                const statusCode = error instanceof Error
                    ? error.message.includes("Invalid") || error.message.includes("required")
                        ? 400
                        : error.message.includes("not found")
                            ? 404
                            : 500
                    : 500;
                res.status(statusCode).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch room",
                });
            }
        });
    }
    getRoomMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { roomId, tutorId } = req.params;
                if (!roomId ||
                    !mongoose.Types.ObjectId.isValid(roomId) ||
                    !tutorId ||
                    !mongoose.Types.ObjectId.isValid(tutorId)) {
                    throw new Error("Valid room ID and tutor ID are required");
                }
                console.log(`Controller: Fetching messages for roomId: ${roomId}, tutorId: ${tutorId}`);
                const room = yield this.chatMsgService.getRoomMessage(roomId, tutorId);
                if (!room) {
                    throw new Error("Room not found or user is not a participant");
                }
                res.status(200).json({
                    success: true,
                    message: "Room Messages Fetched",
                    room,
                });
            }
            catch (error) {
                console.error("Controller: Error in getRoomMessage:", {
                    message: error instanceof Error ? error.message : String(error),
                    roomId: req.params.roomId,
                    tutorId: req.params.tutorId,
                    stack: error instanceof Error ? error.stack : undefined,
                });
                const statusCode = error instanceof Error
                    ? error.message.includes("Invalid") || error.message.includes("required")
                        ? 400
                        : error.message.includes("not found") || error.message.includes("participant")
                            ? 404
                            : 500
                    : 500;
                res.status(statusCode).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch room messages",
                });
            }
        });
    }
}
