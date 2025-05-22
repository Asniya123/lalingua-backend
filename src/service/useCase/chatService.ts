import mongoose, { FilterQuery } from "mongoose";
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

  
async getRoom(receiverId: string, senderId: string): Promise<IConversation | null> {
  try {
    console.log(`Service: getRoom called with receiverId: ${receiverId}, senderId: ${senderId}`);

    if (
      !mongoose.Types.ObjectId.isValid(receiverId) ||
      !mongoose.Types.ObjectId.isValid(senderId)
    ) {
      console.error("Invalid ObjectId:", { receiverId, senderId });
      throw new CustomError(
        `Invalid receiver or sender ID: receiverId=${receiverId}, senderId=${senderId}`,
        HttpStatusCode.BAD_REQUEST
      );
    }

  
    const [receiverTutor, receiverStudent, senderTutor, senderStudent] = await Promise.all([
      this.tutorRepo.findById(receiverId),
      this.studentRepo.findById(receiverId),
      this.tutorRepo.findById(senderId),
      this.studentRepo.findById(senderId),
    ]);

    const receiver = receiverTutor || receiverStudent;
    const sender = senderTutor || senderStudent;

    if (!receiver) {
      console.error(`Receiver not found for receiverId: ${receiverId}`);
      throw new CustomError(`Receiver not found: receiverId=${receiverId}`, HttpStatusCode.NOT_FOUND);
    }
    if (!sender) {
      console.error(`Sender not found for senderId: ${senderId}`);
      throw new CustomError(`Sender not found: senderId=${senderId}`, HttpStatusCode.NOT_FOUND);
    }

    console.log("User lookup:", {
      receiver: receiver ? { _id: receiver._id, type: receiverTutor ? 'Tutor' : 'Student' } : null,
      sender: sender ? { _id: sender._id, type: senderTutor ? 'Tutor' : 'Student' } : null,
    });

    let room = await this.chatRepository.getRoom(receiverId, senderId);
    if (!room) {
      console.log("No existing room found, creating new room:", { receiverId, senderId });
      room = await this.chatRepository.createRoom(receiverId, senderId);
    }

    if (!room || !room._id) {
      console.error("Failed to create or fetch room:", { receiverId, senderId });
      throw new CustomError("Failed to create or fetch room", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }

    console.log("Room fetched/created:", JSON.stringify(room, null, 2));
    return room;
  } catch (error: any) {
    console.error("Service: Error in getRoom:", {
      message: error.message,
      receiverId,
      senderId,
      code: error.code,
      stack: error.stack,
    });
    throw error instanceof CustomError
      ? error
      : new CustomError(
          `Failed to fetch or create room: ${error.message}`,
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
  }
}

  async getRoomMessage(roomId: string, userId: string): Promise<IConversation | null> {
    try {
      console.log(`Service: getRoomMessage called with roomId: ${roomId}, userId: ${userId}`);
      if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(userId)) {
        console.error("Invalid roomId or userId:", { roomId, userId });
        throw new CustomError("Invalid room or user ID", HttpStatusCode.BAD_REQUEST);
      }

      const room = await this.chatRepository.getRoomById(roomId, userId);

      if (!room) {
        console.error("Room not found:", { roomId, userId });
        throw new CustomError("Room not found", HttpStatusCode.NOT_FOUND);
      }

       
      const otherParticipant = room.participants.find(
        (p: any) => p._id.toString() !== userId
      );

      if (!otherParticipant) {
        console.error("No other participant found in room:", { roomId, userId });
        throw new CustomError("No other participants found", HttpStatusCode.INTERNAL_SERVER_ERROR);
      }

      const conversation: IConversation = {
        _id: room._id,
        participants: room.participants,
        participantsRef: room.participantsRef,
        messages: room.messages || [],
        lastMessage: room.lastMessage || null,
        name: otherParticipant.name || otherParticipant.username || room.name || "Unknown",
        profilePicture: otherParticipant.profilePicture || room.profilePicture || null,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      };

      console.log("Room messages fetched:", JSON.stringify(conversation, null, 2));
      return conversation;
    } catch (error: any) {
      console.error(`Service: Error in getRoomMessage for roomId: ${roomId}, userId: ${userId}:`, {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw error instanceof CustomError
        ? error
        : new CustomError(
            `Failed to fetch room messages: ${error.message}`,
            HttpStatusCode.INTERNAL_SERVER_ERROR
          );
    }
  }

  async saveMessage(
  roomId: string,
  senderId: string,
  message: string,
  message_time: Date,
  message_type: string
): Promise<IMessage | null> {
  try {
    console.log(`Service: Saving message for roomId: ${roomId}, senderId: ${senderId}`);

    
    if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(senderId)) {
      console.error("Invalid roomId or senderId:", { roomId, senderId });
      throw new CustomError("Invalid room or sender ID", HttpStatusCode.BAD_REQUEST);
    }
    if (!message.trim()) {
      console.error("Message is empty:", { roomId, senderId });
      throw new CustomError("Message cannot be empty", HttpStatusCode.BAD_REQUEST);
    }

   
    const sender = (await this.tutorRepo.findById(senderId)) || (await this.studentRepo.findById(senderId));
    if (!sender) {
      console.error(`Sender not found: ${senderId}`);
      throw new CustomError(`Sender not found: ${senderId}`, HttpStatusCode.NOT_FOUND);
    }

    
    const room = await this.chatRepository.getRoomById(roomId, senderId);
    if (!room) {
      console.error(`Room not found: ${roomId}`);
      throw new CustomError(`Room not found: ${roomId}`, HttpStatusCode.NOT_FOUND);
    }

    const savedMessage = await this.chatRepository.saveMessage(
      roomId,
      senderId,
      message.trim(),
      message_time,
      message_type
    );

    if (!savedMessage) {
      console.error("Message not saved:", { roomId, senderId, message });
      throw new CustomError("Message not saved", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }

    console.log("Message saved:", JSON.stringify(savedMessage, null, 2));
    return savedMessage;
  } catch (error: any) {
    console.error("Service: Error in saveMessage:", {
      message: error.message,
      roomId,
      senderId,
      code: error.code,
      stack: error.stack,
    });
    throw error instanceof CustomError
      ? error
      : new CustomError(
          `Failed to save message: ${error.message}`,
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
  }
}

  async getContacts(search: string, userId: string | undefined): Promise<(IStudent | ITutor)[]> {
    try {
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        console.error("Invalid or missing user ID:", userId);
        throw new CustomError("Valid user ID is required", HttpStatusCode.BAD_REQUEST);
      }

      const query = search
        ? { username: { $regex: search, $options: "i" } }
        : {};

      const students = await this.studentRepo.getContact(query, userId);
      const tutors = await this.tutorRepo.getContact(query, userId);

      const users = [...(students || []), ...(tutors || [])];
      if (!users.length) {
        console.warn("No users found for search:", { search, userId });
        return []; 
      }
      console.log("Contacts fetched:", JSON.stringify(users, null, 2));
      return users;
    } catch (error: any) {
      console.error("Error in getContacts:", {
        message: error.message,
        userId,
        search,
        code: error.code,
        stack: error.stack,
      });
      throw error instanceof CustomError
        ? error
        : new CustomError(
            `Failed to fetch contacts: ${error.message}`,
            HttpStatusCode.INTERNAL_SERVER_ERROR
          );
    }
  }

  async getChats(search: string, userId: string | undefined): Promise<IChatData[]> {
    try {
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        console.error("Invalid or missing user ID:", userId);
        throw new CustomError("Valid user ID is required", HttpStatusCode.BAD_REQUEST);
      }

      
      const query: FilterQuery<IConversation> = {};
      if (search) {
        
        query.name = { $regex: search, $options: "i" }; 
      }

      const chats = await this.chatRepository.getChats(query, userId);
      console.log("Chats fetched:", JSON.stringify(chats, null, 2));
      return chats || [];
    } catch (error: any) {
      console.error("Error in getChats:", {
        message: error.message,
        userId,
        search,
        code: error.code,
        stack: error.stack,
      });
      throw error instanceof CustomError
        ? error
        : new CustomError(
            `Failed to fetch chats: ${error.message}`,
            HttpStatusCode.INTERNAL_SERVER_ERROR
          );
    }
  }

  async getTutorChats(search: string, tutorId: string | undefined): Promise<IChatData[]> {
    try {
      if (!tutorId || !mongoose.Types.ObjectId.isValid(tutorId)) {
        console.error("Invalid or missing tutor ID:", tutorId);
        throw new CustomError("Valid tutor ID is required", HttpStatusCode.BAD_REQUEST);
      }

     
      const query: FilterQuery<IConversation> = {};
      if (search) {
        query.name = { $regex: search, $options: "i" }; 
      }

      const chats = await this.chatRepository.getTutorChats(query, tutorId);
      if (!chats || chats.length === 0) {
        console.warn("No chats found for tutor:", { tutorId, search });
        return [];
      }
      console.log("Tutor chats fetched:", JSON.stringify(chats, null, 2));
      return chats;
    } catch (error: any) {
      console.error("Error in getTutorChats:", {
        message: error.message,
        tutorId,
        search,
        code: error.code,
        stack: error.stack,
      });
      throw error instanceof CustomError
        ? error
        : new CustomError(
            `Failed to fetch tutor chats: ${error.message}`,
            HttpStatusCode.INTERNAL_SERVER_ERROR
          );
    }
  }
}

export default new ChatService(chatRepository, studentRepo, tutorRepo);