import { Request, Response } from "express";
import { isString } from "../Admin/adminController.js";
import HttpStatusCode from "../../domain/enum/httpstatus.js";
import { IChatMsgController, IChatMsgService } from "../../interface/IConversation.js";
import { CustomError } from "../../domain/errors/customError.js";

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
        throw new CustomError("User ID is required", HttpStatusCode.BAD_REQUEST);
      }

      const users = await this.chatMsgService.getContacts(search, userId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Contacts Fetched",
        users,
      });
    } catch (error) {
      const statusCode =
        error instanceof CustomError && error.statusCode
          ? error.statusCode
          : HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
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
        throw new CustomError("User ID is required", HttpStatusCode.BAD_REQUEST);
      }

      const users = await this.chatMsgService.getChats(search, userId);
     
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Chats Fetched",
        users,
      });
    } catch (error) {
      const statusCode =
        error instanceof CustomError && error.statusCode
          ? error.statusCode
          : HttpStatusCode.INTERNAL_SERVER_ERROR;
      console.error(`Error in getChats: ${error instanceof Error ? error.message : String(error)}`);
      res.status(statusCode).json({
        success: false,
        message: "Failed to fetch chats",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getRoom(req: Request, res: Response): Promise<void> {
    try {
        const { receiverId, senderId } = req.params;
       

        if (!receiverId || !senderId) {
            throw new CustomError("Receiver ID and Sender ID are required", HttpStatusCode.BAD_REQUEST);
        }

        const room = await this.chatMsgService.getRoom(receiverId, senderId);

        res.status(HttpStatusCode.OK).json({
            success: true,
            message: "Room Fetched",
            room,
        });
    } catch (error) {
        const statusCode =
            error instanceof CustomError && error.statusCode
                ? error.statusCode
                : HttpStatusCode.INTERNAL_SERVER_ERROR;

        console.error(`Error in getRoom for receiverId: ${req.params.receiverId}, senderId: ${req.params.senderId}:`, error);
        res.status(statusCode).json({
            success: false,
            message: "Failed to fetch room",
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

async getRoomMessage(req: Request, res: Response): Promise<void> {
  const { roomId, userId } = req.params;
  try {
      if (!roomId || !userId) {
          throw new CustomError("Room ID and User ID are required", HttpStatusCode.BAD_REQUEST);
      }

      const room = await this.chatMsgService.getRoomMessage(roomId, userId);

      res.status(HttpStatusCode.OK).json({
          success: true,
          message: "Room Messages Fetched",
          room, 
      });
  } catch (error) {
      const statusCode =
          error instanceof CustomError && error.statusCode
              ? error.statusCode
              : HttpStatusCode.INTERNAL_SERVER_ERROR;
      console.error(`Error in getRoomMessage for roomId: ${roomId}, userId: ${userId}:`, error);
      res.status(statusCode).json({
          success: false,
          message: "Failed to fetch room messages",
          error: error instanceof Error ? error.message : String(error),
      });
  }
}
}
