import { Request, Response } from "express";
import HttpStatusCode from "../../domain/enum/httpstatus.js";
import { IChatMsgController, IChatMsgService } from "../../interface/IConversation.js";
import { CustomError } from "../../domain/errors/customError.js";
import { isString } from "../Admin/adminController.js";

export default class TutorChatController implements IChatMsgController {
  private chatMsgService: IChatMsgService;

  constructor(chatMsgService: IChatMsgService) {
    this.chatMsgService = chatMsgService;
  }

  async getContacts(req: Request, res: Response): Promise<void> {
    try {
      const search = isString(req.query.search) ? req.query.search : "";
      const { tutorId } = req.params;
      if (!tutorId) {
        throw new CustomError("Tutor ID is required", HttpStatusCode.BAD_REQUEST);
      }

      const users = await this.chatMsgService.getContacts(search, tutorId);

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
      const { tutorId } = req.params;
      if (!tutorId) {
        throw new CustomError("Tutor ID is required", HttpStatusCode.BAD_REQUEST);
      }

      console.log('Calling chatMsgService.getTutorChats with tutorId:', tutorId, 'search:', search);
      const users = await this.chatMsgService.getTutorChats(search, tutorId);
      console.log('chatMsgService.getTutorChats response:', users);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Tutor Chats Fetched",
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
        message: "Failed to fetch tutor chats",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getRoom(req: Request, res: Response): Promise<void> {
    try {
      const { receiverId, senderId } = req.params;
      console.log(`Controller: getRoom called with receiverId: ${receiverId}, senderId: ${senderId}`);
      if (!receiverId || !senderId) {
        throw new CustomError("Receiver ID and Sender ID are required", HttpStatusCode.BAD_REQUEST);
      }
      const room = await this.chatMsgService.getRoom(receiverId, senderId);
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: room ? "Room Fetched" : "Room Created",
        room,
      });
    } catch (error) {
      console.error("Controller: Error in getRoom:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      const statusCode =
        error instanceof CustomError && error.statusCode
          ? error.statusCode
          : HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch room",
      });
    }
  }

  async getRoomMessage(req: Request, res: Response): Promise<void> {
  const { roomId, tutorId } = req.params;
  try {
    console.log(`Controller: getRoomMessage called with roomId: ${roomId}, tutorId: ${tutorId}`);
    if (!roomId || !tutorId) {
      throw new CustomError("Room ID and Tutor ID are required", HttpStatusCode.BAD_REQUEST);
    }
    const room = await this.chatMsgService.getRoomMessage(roomId, tutorId);
    if (!room) {
      throw new CustomError("Room not found or user is not a participant", HttpStatusCode.NOT_FOUND);
    }
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
    console.error(`Error in getRoomMessage for roomId: ${roomId}, tutorId: ${tutorId}:`, error);
    res.status(statusCode).json({
      success: false,
      message: error instanceof CustomError ? error.message : "Failed to fetch room messages",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
}