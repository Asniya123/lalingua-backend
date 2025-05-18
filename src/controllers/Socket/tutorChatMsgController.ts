import { Request, Response } from "express";
import { isString } from "../Admin/adminController.js";
import HttpStatusCode from "../../domain/enum/httpstatus.js";
import {  IChatMsgService, ITutorChatMsgcontroller } from "../../interface/IConversation.js";
import { CustomError } from "../../domain/errors/customError.js";
import mongoose from "mongoose";

export default class TutorChatMsgController implements ITutorChatMsgcontroller {
  private chatMsgService: IChatMsgService;

  constructor(chatMsgService: IChatMsgService) {
    this.chatMsgService = chatMsgService;
  }

  

  async getChats(req: Request, res: Response): Promise<void> {
    try {
      const search = isString(req.query.search) ? req.query.search : "";
      const { tutorId } = req.params;
      if (!tutorId) {
        throw new CustomError("Tutor ID is required", HttpStatusCode.BAD_REQUEST);
      }
      if (!mongoose.Types.ObjectId.isValid(tutorId)) {
        throw new CustomError("Invalid Tutor ID format", HttpStatusCode.BAD_REQUEST);
      }

      const users = await this.chatMsgService.getTutorChats(search, tutorId);

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
      console.error(`Error in getTutorChats for tutorId: ${req.params.tutorId}: ${error instanceof Error ? error.message : String(error)}`);
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
      if (!receiverId || !senderId) {
        throw new CustomError("Receiver ID and Sender ID are required", HttpStatusCode.BAD_REQUEST);
      }
      if (!mongoose.Types.ObjectId.isValid(receiverId) || !mongoose.Types.ObjectId.isValid(senderId)) {
        throw new CustomError("Invalid Receiver or Sender ID format", HttpStatusCode.BAD_REQUEST);
      }

      const room = await this.chatMsgService.getRoom(receiverId, senderId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Tutor Room Fetched",
        room,
      });
    } catch (error) {
      const statusCode =
        error instanceof CustomError && error.statusCode
          ? error.statusCode
          : HttpStatusCode.INTERNAL_SERVER_ERROR;
      console.error(`Error in getTutorRoom for receiverId: ${req.params.receiverId}, senderId: ${req.params.senderId}: ${error instanceof Error ? error.message : String(error)}`);
      res.status(statusCode).json({
        success: false,
        message: "Failed to fetch tutor room",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getRoomMessage(req: Request, res: Response): Promise<void> {
    const { roomId, tutorId } = req.params;
    try {
      if (!roomId || !tutorId) {
        throw new CustomError("Room ID and Tutor ID are required", HttpStatusCode.BAD_REQUEST);
      }
      if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(tutorId)) {
        throw new CustomError("Invalid Room or Tutor ID format", HttpStatusCode.BAD_REQUEST);
      }

      const room = await this.chatMsgService.getRoomMessage(roomId, tutorId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Tutor Room Messages Fetched",
        room: [room],
      });
    } catch (error) {
      const statusCode =
        error instanceof CustomError && error.statusCode
          ? error.statusCode
          : HttpStatusCode.INTERNAL_SERVER_ERROR;
      console.error(`Error in getTutorRoomMessage for roomId: ${roomId}, tutorId: ${tutorId}: ${error instanceof Error ? error.message : String(error)}`);
      res.status(statusCode).json({
        success: false,
        message: "Failed to fetch tutor room messages",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}