import mongoose from "mongoose";
import HttpStatusCode from "../../domain/enum/httpstatus.js";
import { CustomError } from "../../domain/errors/customError.js";
import {
  IChatData,
  IChatMsgService,
  IChatRepository,
  IConversation,
  IMessage,
  Participant,
} from "../../interface/IConversation.js";
import { IStudent, IStudentRepository } from "../../interface/IStudent.js";
import { ITutor, ITutorRepository } from "../../interface/ITutor.js";
import chatRepository from "../../repositories/chatRepository.js";
import studentRepo from "../../repositories/student/studentRepo.js";
import tutorRepo from "../../repositories/tutor/tutorRepo.js";
// import { INotification } from "../../interface/INotification.js";

class ChatService implements IChatMsgService {
  private chatRepository: IChatRepository;
  private studentRepo: IStudentRepository;
  private tutorRepo: ITutorRepository;

  constructor(
    chatRepository: IChatRepository,
    studentRepo: IStudentRepository,
    tutorRepo: ITutorRepository
  ) {
    this.chatRepository = chatRepository;
    this.studentRepo = studentRepo;
    this.tutorRepo = tutorRepo;
  }
  getRoomById(roomId: string, userId: string): Promise<IConversation | null> {
    throw new Error("Method not implemented.");
  }

  // async saveAdminNotification(notification: INotification): Promise<INotification> {
  //   return this.chatRepository.saveAdminNotification(notification);
  // }

  // async saveNotification(notification: INotification): Promise<INotification> {
  //   return this.chatRepository.saveNotification(notification);
  // }

  async saveMessage(
    roomId: string,
    senderId: string,
    message: string,
    message_time: Date,
    message_type: string
  ): Promise<IMessage | null> {
    try {
      const savedMessage = await this.chatRepository.saveMessage(
        roomId,
        senderId,
        message,
        message_time,
        message_type
      );
      if (!savedMessage) {
        throw new CustomError(
          "Message not saved",
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
      return savedMessage;
    } catch (error) {
      throw error;
    }
  }

  async getContacts(
    search: string,
    userId: string | undefined
  ): Promise<(IStudent | ITutor)[]> {
    try {
      if (!userId) {
        throw new CustomError(
          "User ID is required",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const query = search
        ? { username: { $regex: search, $options: "i" } }
        : {};

      const students = await this.studentRepo.getContact(query, userId);
      const tutors = await this.tutorRepo.getContact(query, userId);

      const studentsArray = students || [];
      const tutorsArray = tutors || [];

      const users = [...studentsArray, ...tutorsArray];
      if (!users.length) {
        throw new CustomError("No users found", HttpStatusCode.NOT_FOUND);
      }
      return users;
    } catch (error) {
      console.error("Error in getContacts:", error);
      throw error;
    }
  }

  async getChats(
    search: string,
    userId: string | undefined
  ): Promise<IChatData[] | null> {
    try {
      if (!userId) {
        throw new CustomError(
          "User ID is required",
          HttpStatusCode.BAD_REQUEST
        );
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", HttpStatusCode.BAD_REQUEST);
      }

      const query = search
        ? { username: { $regex: search, $options: "i" } }
        : {};

      const chats = await this.chatRepository.getChats(query, userId);

      if (!chats || chats.length === 0) {
        throw new CustomError("No chats found", HttpStatusCode.NOT_FOUND);
      }
      return chats;
    } catch (error) {
      console.error("Error in getChats:", error);
      throw error;
    }
  }

  async getRoom(receiverId: string, senderId: string): Promise<IConversation | null> {
    try {
        if (
            !mongoose.Types.ObjectId.isValid(receiverId) ||
            !mongoose.Types.ObjectId.isValid(senderId)
        ) {
            throw new CustomError(
                `Invalid receiver or sender ID: receiverId=${receiverId}, senderId=${senderId}`,
                HttpStatusCode.BAD_REQUEST
            );
        }
      
        const tutor = await this.tutorRepo.findById(receiverId) || await this.tutorRepo.findById(senderId);
        const student = await this.studentRepo.findById(receiverId) || await this.studentRepo.findById(senderId);
        if (!tutor && !student) {
            throw new CustomError(
                `User not found: receiverId=${receiverId} or senderId=${senderId}`,
                HttpStatusCode.BAD_REQUEST
            );
        }
        let room = await this.chatRepository.getRoom(receiverId, senderId);
        if (!room) {
            room = await this.chatRepository.createRoom(receiverId, senderId);
        }
        return room;
    } catch (error) {
        console.error("Error in getRoom:", error);
        throw error;
    }
}

 async getRoomMessage(roomId: string, userId: string): Promise<IConversation | null> {
  try {
    if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new CustomError("Invalid room or user ID", HttpStatusCode.BAD_REQUEST);
    }

    const room = await this.chatRepository.getRoomById(roomId, userId);

    if (!room) {
      throw new CustomError("Room not found", HttpStatusCode.NOT_FOUND);
    }

    if (!room.participants || room.participants.length === 0) {
      console.error(`Room ${roomId} has no participants: ${JSON.stringify(room)}`);
      throw new CustomError("Room data missing participants", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }

    
    const otherParticipant = (room.participants as unknown as Participant[]).find(
      (p) => p._id.toString() !== userId
    );

    if (!otherParticipant) {
      throw new CustomError("No other participants found", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }

    const conversation: IConversation = {
      _id: room._id,
      participants: room.participants.map((p: any) => new mongoose.Types.ObjectId(p._id)),
      participantsRef: room.participantsRef, 
      messages: Array.isArray(room.messages) ? room.messages.map((m: any) => m._id) : [],
      lastMessage: room.lastMessage ? (room.lastMessage as any)._id : null,
      name: otherParticipant.name || otherParticipant.username || room.name || "Unknown",
      profilePicture: otherParticipant.profilePicture || room.profilePicture || null,
    };

    return conversation;
  } catch (error) {
    console.error(`Error in getRoomMessage for roomId: ${roomId}, userId: ${userId}:`, error);
    throw error instanceof CustomError
      ? error
      : new CustomError("Failed to fetch room messages", HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
}

  // Tutor-specific methods
  async getTutorChats(
    search: string,
    tutorId: string | undefined
  ): Promise<IChatData[] | null> {
    try {
      if (!tutorId) {
        throw new CustomError(
          "Tutor ID is required",
          HttpStatusCode.BAD_REQUEST
        );
      }
      if (!mongoose.Types.ObjectId.isValid(tutorId)) {
        throw new CustomError("Invalid tutor ID", HttpStatusCode.BAD_REQUEST);
      }
  
      const query = search
        ? { username: { $regex: search, $options: "i" } }
        : {};
  
      const chats = await this.chatRepository.getTutorChats(query, tutorId);
  
      if (!chats || chats.length === 0) {
        throw new CustomError("No chats found", HttpStatusCode.NOT_FOUND);
      }
      return chats;
    } catch (error) {
      console.error("Error in getTutorChats:", error);
      throw error;
    }
  }
}

export default new ChatService(chatRepository, studentRepo, tutorRepo);