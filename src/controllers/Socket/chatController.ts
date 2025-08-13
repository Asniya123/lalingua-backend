import { Request, Response } from "express";
import { isString } from "../Admin/adminController";
import { IChatMsgController, IChatMsgService } from "../../interface/IConversation";

export default class ChatMsgController implements IChatMsgController {
  private chatMsgService: IChatMsgService;

  constructor(chatMsgService: IChatMsgService) {
    this.chatMsgService = chatMsgService;
  }

  async getContacts(req: Request, res: Response): Promise<void> {
    try {
      const search = isString(req.query.search) ? req.query.search : "";
      const { userId } = req.params;
      if (!userId) {
        throw new Error("User ID is required");
      }

      const users = await this.chatMsgService.getContacts(search, userId);

      res.status(200).json({
        success: true,
        message: "Contacts Fetched",
        users,
      });
    } catch (error) {
      console.error(`Error in getContacts: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contacts",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getChats(req: Request, res: Response): Promise<void> {
    try {
      const search = isString(req.query.search) ? req.query.search : "";
      const { userId } = req.params;
      if (!userId) {
        throw new Error("User ID is required");
      }

      console.log("Calling chatMsgService.getChats with userId:", userId, "search:", search);
      const users = await this.chatMsgService.getChats(search, userId);
      console.log("chatMsgService.getChats response:", users);

      res.status(200).json({
        success: true,
        message: "Chats Fetched",
        users,
      });
    } catch (error) {
      console.error(`Error in getChats: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({
        success: false,
        message: "Failed to fetch chats",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getRoom(req: Request, res: Response): Promise<void> {
    try {
      const { receiverId, senderId } = req.params;
      console.log(`Controller: getRoom called with receiverId: ${receiverId}, senderId: ${senderId}`);
      if (!receiverId || !senderId) {
        throw new Error("Receiver ID and Sender ID are required");
      }
      const room = await this.chatMsgService.getRoom(receiverId, senderId);
      res.status(200).json({
        success: true,
        message: room ? "Room Fetched" : "Room Created",
        room,
      });
    } catch (error) {
      console.error("Controller: Error in getRoom:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch room",
      });
    }
  }

  async getRoomMessage(req: Request, res: Response): Promise<void> {
    const { roomId, userId } = req.params;
    try {
      console.log(`Controller: getRoomMessage called with roomId: ${roomId}, userId: ${userId}`);
      if (!roomId || !userId) {
        throw new Error("Room ID and User ID are required");
      }

      const room = await this.chatMsgService.getRoomMessage(roomId, userId);

      res.status(200).json({
        success: true,
        message: "Room Messages Fetched",
        room,
      });
    } catch (error) {
      console.error(`Error in getRoomMessage for roomId: ${roomId}, userId: ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch room messages",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}