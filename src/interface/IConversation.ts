import mongoose, { FilterQuery, Types } from "mongoose";
import { IStudent } from "./IStudent.js";
import { INotification } from "./INotification.js";
import { Socket } from "socket.io";
import { Request, Response } from "express";
import { ITutor } from "./ITutor.js";

export interface Participant {
    _id: mongoose.Types.ObjectId;
    username?: string;
    name?: string;
    profilePicture?: string | null;
    email?: string;
}

export interface IMessage {
    _id: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    message: string;
    message_time: Date;
    message_type: string;
    isRead: boolean;
    chatId: mongoose.Types.ObjectId;
    roomId: mongoose.Types.ObjectId;
}

export interface IConversation extends Omit<Document, keyof Document> {
    _id: mongoose.Types.ObjectId;
    participants: Participant[];
    participantsRef: string[];
    messages: IMessage[];
    lastMessage: mongoose.Types.ObjectId | null;
    name: string;
    profilePicture: string | null;
    createdAt?: Date;
    updatedAt?: Date
}

export interface IChatData {
  _id: string;
  chatId: string;
  name: string;
  profilePicture: string | null;
  lastMessage: string | null;
  unReadCount: number;
}



export interface IChatRepository {
  getMessagesByRoom(roomId: string): Promise<IConversation>;
  saveMessage(
    roomId: string,
    senderId: string,
    message: string,
    message_time: Date,
    message_type: string
  ): Promise<IMessage | null>;
  getRoom(recieverId: string, senderId: string): Promise<IConversation | null>;
  createRoom(receiverId: string, senderId: string): Promise<IConversation>;
  getRoomById(roomId: string, userId: String): Promise<IConversation | null>;
  getChats(
    query: FilterQuery<IConversation>,
    userId: string
  ): Promise<IChatData[] | null>;
  getUnreadMessageCount(chatId: string, userId: string): Promise<number>;
  getTutorChats(
    query: FilterQuery<IConversation>,
    tutorId: string
  ): Promise<IChatData[] | null>;
  // saveAdminNotification(notification: INotification): Promise<INotification>;
  // saveNotification(notification: INotification): Promise<INotification>;
  // saveMessages(message: IMessage): Promise<void>;
}

export interface IChatMsgService {
  getContacts(
    search: string,
    userId: string | undefined
  ): Promise<(IStudent | ITutor)[]>;
  getChats(
    search: string,
    userId: string | undefined
  ): Promise<IChatData[] | null>;
  getRoom(recieverId: string, senderId: string): Promise<IConversation | null>;
  getRoomMessage(roomId: string, userId: string): Promise<IConversation | null>;
  getTutorChats(
    search: string,
    tutorId: string | undefined
  ): Promise<IChatData[] | null>;
  // getRoomById(roomId: string, userId: string): Promise<IConversation | null>;
  // saveAdminNotification(notification: INotification): Promise<INotification>;
  // saveNotification(notification: INotification): Promise<INotification>;
}

export interface ISocketController {
  onConnection(socket: Socket): void;
}

export interface ISocketService {
  saveMessage(
    roomId: string,
    senderId: string,
    message: string,
    message_time: Date,
    message_type: string
  ): Promise<IMessage | null>;
}

export interface IChatSummary {
  _id: string;
  chatId: string;
  username: string;
  profilePicture: string | null;
  lastMessage: string | null;
  unReadCount: number;
}

export interface IChatMsgController {
  getContacts(req: Request, res: Response): Promise<void>;
  getChats(req: Request, res: Response): Promise<void>;
  getRoom(req: Request, res: Response): Promise<void>;
  getRoomMessage(req: Request, res: Response): Promise<void>;
}

export interface ITutorChatMsgcontroller {
  getChats(req: Request, res: Response): Promise<void>;
  getRoom(req: Request, res: Response): Promise<void>;
  getRoomMessage(req: Request, res: Response): Promise<void>;
}
