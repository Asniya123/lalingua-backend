import mongoose, { FilterQuery } from "mongoose";
import {
  IChatData,
  IChatRepository,
  IConversation,
  IMessage,
} from "../interface/IConversation.js";
import chatModel from "../models/chatModel.js";
import MessageModel from "../models/messageModel.js";
import NotificationModel from "../models/notificationModel.js";
import { CustomError } from "../domain/errors/customError.js";
import HttpStatusCode from "../domain/enum/httpstatus.js";
import { INotification } from "../interface/INotification.js";

class ChatRepository implements IChatRepository {
  async saveMessage(
    roomId: string,
    senderId: string,
    message: string,
    message_time: Date,
    message_type: string
  ): Promise<IMessage | null> {
    try {
      const newMessage = await MessageModel.create({
        chatId: roomId,
        senderId,
        message,
        message_time,
        message_type,
      });

      await chatModel.findByIdAndUpdate(
        roomId,
        {
          $push: { messages: newMessage._id },
          $set: { lastMessage: newMessage._id },
        },
        { new: true }
      );

      return newMessage.toObject() as IMessage;
    } catch (error) {
      console.error("Error saving message:", error);
      throw error;
    }
  }

  async getMessagesByRoom(roomId: string): Promise<IConversation> {
    try {
      const room = await chatModel.findById(roomId).populate({
        path: "messages",
        populate: {
          path: "senderId",
          select: "_id username email profilePicture",
        },
      });

      if (!room) {
        throw new Error("Room not found");
      }

      return {
        ...room.toObject(),
        messages: room.messages.length ? room.messages : [],
      } as IConversation;
    } catch (error) {
      console.error("Error fetching room messages:", error);
      throw error;
    }
  }

  async getRoom(
    receiverId: string,
    senderId: string
  ): Promise<IConversation | null> {
    try {
      const room = await chatModel
        .findOne({
          participants: { $all: [receiverId, senderId] },
        })
        .populate({
          path: "participants",
          select: "_id username email profilePicture name",
        });
      return room ? (room.toObject() as IConversation) : null;
    } catch (error) {
      console.error("Error fetching room:", error);
      throw error;
    }
  }

  async createRoom(
    receiverId: string,
    senderId: string
  ): Promise<IConversation> {
    try {
      const room = await chatModel.create({
        participants: [receiverId, senderId],
        messages: [],
      });
      await room.populate({
        path: "participants",
        select: "_id username email profilePicture name",
      });
      return room.toObject() as IConversation;
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  }

  async getRoomById(
    roomId: string,
    userId: string
  ): Promise<IConversation | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        throw new CustomError("Invalid room ID", HttpStatusCode.BAD_REQUEST);
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid user ID", HttpStatusCode.BAD_REQUEST);
      }

      console.log(`Fetching room with roomId: ${roomId}, userId: ${userId}`);

      await MessageModel.updateMany(
        { chatId: roomId, senderId: { $ne: userId }, isRead: false },
        { $set: { isRead: true } }
      );

      const room = await chatModel.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(roomId),
            participants: { $in: [new mongoose.Types.ObjectId(userId)] },
          },
        },
        {
          $lookup: {
            from: "tutors",
            localField: "participants",
            foreignField: "_id",
            as: "tutors",
          },
        },
        {
          $lookup: {
            from: "students",
            localField: "participants",
            foreignField: "_id",
            as: "students",
          },
        },
        {
          $lookup: {
            from: "messages",
            localField: "messages",
            foreignField: "_id",
            as: "messages",
          },
        },
        {
          $lookup: {
            from: "messages",
            localField: "lastMessage",
            foreignField: "_id",
            as: "lastMessage",
          },
        },
        {
          $project: {
            _id: 1,
            participants: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$participants",
                    as: "participant",
                    cond: { $ne: ["$$participant", new mongoose.Types.ObjectId(userId)] },
                  },
                },
                0,
              ],
            },
            messages: 1,
            lastMessage: { $arrayElemAt: ["$lastMessage", 0] },
            name: {
              $cond: {
                if: { $gt: [{ $size: "$tutors" }, 0] },
                then: {
                  $let: {
                    vars: { tutor: { $arrayElemAt: ["$tutors", 0] } },
                    in: { $ifNull: ["$$tutor.name", "$$tutor.username", "Unknown"] },
                  },
                },
                else: {
                  $let: {
                    vars: { student: { $arrayElemAt: ["$students", 0] } },
                    in: { $ifNull: ["$$student.username", "$$student.name", "Unknown"] },
                  },
                },
              },
            },
            profilePicture: {
              $cond: {
                if: { $gt: [{ $size: "$tutors" }, 0] },
                then: {
                  $let: {
                    vars: { tutor: { $arrayElemAt: ["$tutors", 0] } },
                    in: { $ifNull: ["$$tutor.profilePicture", null] },
                  },
                },
                else: {
                  $let: {
                    vars: { student: { $arrayElemAt: ["$students", 0] } },
                    in: { $ifNull: ["$$student.profilePicture", null] },
                  },
                },
              },
            },
          },
        },
      ]);

      if (!room || room.length === 0) {
        console.error(`No room found for roomId: ${roomId}, userId: ${userId}`);
        throw new CustomError("Room not found", HttpStatusCode.NOT_FOUND);
      }

      const roomData = room[0];
      if (!roomData.participants) {
        console.error("Missing participants in room data:", JSON.stringify(roomData, null, 2));
        throw new CustomError("Room data missing participants", HttpStatusCode.INTERNAL_SERVER_ERROR);
      }

      const participantId = roomData.participants.toString();
      const tutor = await mongoose.model("Tutor").findById(participantId).lean();
      const student = await mongoose.model("Student").findById(participantId).lean();
      if (!tutor && !student) {
        console.error(`Participant ${participantId} not found in tutors or students`);
        roomData.name = "Unknown";
        roomData.profilePicture = null;
      }

      return roomData as IConversation;
    } catch (error) {
      console.error("Error fetching room by ID:", error);
      throw error instanceof CustomError
        ? error
        : new CustomError("Failed to fetch room data", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getChats(query: FilterQuery<IConversation>, userId: string): Promise<IChatData[] | null> {
    try {
      const chatData = await chatModel.aggregate([
        { $match: { participants: new mongoose.Types.ObjectId(userId) } },
        { $unwind: "$participants" },
        {
          $match: {
            participants: {
              $not: { $eq: new mongoose.Types.ObjectId(userId) },
            },
          },
        },
        {
          $lookup: {
            from: "tutors",
            localField: "participants",
            foreignField: "_id",
            as: "tutor",
          },
        },
        {
          $lookup: {
            from: "students",
            localField: "participants",
            foreignField: "_id",
            as: "student",
          },
        },
        {
          $project: {
            _id: "$participants",
            name: {
              $cond: {
                if: { $gt: [{ $size: "$tutor" }, 0] },
                then: { $arrayElemAt: ["$tutor.name", 0] },
                else: { $arrayElemAt: ["$student.username", 0] },
              },
            },
            profilePicture: {
              $cond: {
                if: { $gt: [{ $size: "$tutor" }, 0] },
                then: { $arrayElemAt: ["$tutor.profilePicture", 0] },
                else: { $arrayElemAt: ["$student.profilePicture", 0] },
              },
            },
            chatId: "$_id",
            lastMessage: 1,
            unReadCount: 1,
            lastMessageRead: { $literal: true },
            isOnline: { $literal: false },
          },
        },
      ]);

      return chatData;
    } catch (error) {
      console.error("Error fetching chats:", error);
      throw error;
    }
  }

  async getUnreadMessageCount(chatId: string, userId: string): Promise<number> {
    try {
      const chatCount = await MessageModel.countDocuments({
        chatId: chatId,
        senderId: { $ne: userId },
        isRead: false,
      });
      return chatCount;
    } catch (error) {
      console.error("Error counting unread messages:", error);
      throw error;
    }
  }

  async saveAdminNotification(notification: INotification): Promise<INotification> {
    try {
      const savedNotification = await NotificationModel.create(notification);
      return savedNotification.toObject() as INotification;
    } catch (error) {
      throw new CustomError("Error saving admin notification", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async saveNotification(notification: INotification): Promise<INotification> {
    try {
      const savedNotification = await NotificationModel.create(notification);
      return savedNotification.toObject() as INotification;
    } catch (error) {
      throw new CustomError("Error saving notification", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async saveMessages(message: IMessage): Promise<void> {
    try {
      await chatModel.updateOne(
        { _id: message.roomId },
        { $push: { messages: message } }
      );
    } catch (error) {
      console.error("Error in saveMessage:", error);
      throw new CustomError("Error saving message", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  // Tutor-specific methods
  async getTutorChats(
    query: FilterQuery<IConversation>,
    tutorId: string
  ): Promise<IChatData[] | null> {
    try {
      const tutorData = await chatModel.aggregate([
        { $match: { participants: new mongoose.Types.ObjectId(tutorId) } },
        { $unwind: "$participants" },
        {
          $match: {
            participants: {
              $not: { $eq: new mongoose.Types.ObjectId(tutorId) },
            },
          },
        },
        {
          $lookup: {
            from: "students",
            localField: "participants",
            foreignField: "_id",
            as: "student",
          },
        },
        {
          $lookup: {
            from: "messages",
            localField: "lastMessage",
            foreignField: "_id",
            as: "lastMessageData",
          },
        },
        {
          $project: {
            _id: "$participants",
            name: { $arrayElemAt: ["$student.username", 0] },
            profilePicture: { $arrayElemAt: ["$student.profilePicture", 0] },
            chatId: "$_id",
            lastMessage: {
              $cond: {
                if: { $gt: [{ $size: "$lastMessageData" }, 0] },
                then: { $arrayElemAt: ["$lastMessageData.message", 0] },
                else: null,
              },
            },
            unReadCount: {
              $cond: {
                if: { $eq: ["$messages", []] },
                then: 0,
                else: {
                  $size: {
                    $filter: {
                      input: "$messages",
                      as: "msg",
                      cond: {
                        $and: [
                          { $ne: ["$$msg.senderId", new mongoose.Types.ObjectId(tutorId)] },
                          { $eq: ["$$msg.isRead", false] },
                        ],
                      },
                    },
                  },
                },
              },
            },
            lastMessageRead: { $literal: true },
            isOnline: { $literal: false },
          },
        },
      ]);

      return tutorData as IChatData[];
    } catch (error) {
      console.error("Error fetching tutor chats:", error);
      throw error;
    }
  }
}

export default new ChatRepository();