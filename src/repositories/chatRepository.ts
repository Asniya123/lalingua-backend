import mongoose, { FilterQuery } from "mongoose";
import {
  IChatData,
  IChatRepository,
  IConversation,
  IMessage,
} from "../interface/IConversation.js";
import chatModel from "../models/chatModel.js";
import MessageModel from "../models/messageModel.js";
import tutorRepo from "./tutor/tutorRepo.js";
import studentRepo from "./student/studentRepo.js";

class ChatRepository implements IChatRepository {
  async saveMessage(
    roomId: string,
    senderId: string,
    message: string,
    message_time: Date,
    message_type: string
  ): Promise<IMessage | null> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(roomId) ||
        !mongoose.Types.ObjectId.isValid(senderId)
      ) {
        throw new Error("Invalid roomId or senderId");
      }

      const allowedMessageTypes = ["text", "image", "video", "file"];
      if (!allowedMessageTypes.includes(message_type)) {
        throw new Error("Invalid message type");
      }

      const conversation = await chatModel.findById(roomId).lean();
      if (!conversation) {
        throw new Error("Chat room not found");
      }

      if (
        !conversation.participants.some((p: any) => p.toString() === senderId)
      ) {
        throw new Error("Sender is not a participant in this conversation");
      }

      console.log(
        `Repository: Saving message for roomId: ${roomId}, senderId: ${senderId}`
      );

      const newMessage = await MessageModel.create({
        chatId: new mongoose.Types.ObjectId(roomId),
        senderId: new mongoose.Types.ObjectId(senderId),
        message,
        message_time,
        message_type,
        isRead: false,
      });

      const updatedChat = await chatModel.findByIdAndUpdate(
        roomId,
        {
          $push: { messages: newMessage._id },
          $set: { lastMessage: newMessage._id },
        },
        { new: true }
      );

      if (!updatedChat) {
        throw new Error("Failed to update chat room");
      }

      console.log(
        "Message saved:",
        JSON.stringify(newMessage.toObject(), null, 2)
      );
      return newMessage.toObject() as IMessage;
    } catch (error: any) {
      console.error("Repository: Error saving message:", {
        message: error.message,
        roomId,
        senderId,
        stack: error.stack,
      });
      throw new Error(`Failed to save message: ${error.message}`);
    }
  }

  async getMessagesByRoom(roomId: string): Promise<IConversation> {
    try {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        throw new Error("Invalid roomId");
      }

      console.log(`Fetching messages for roomId: ${roomId}`);
      const room = await chatModel
        .findById(roomId)
        .populate({
          path: "messages",
          populate: {
            path: "senderId",
            select: "_id username email profilePicture",
          },
        })
        .lean();

      if (!room) {
        throw new Error("Room not found");
      }

      console.log("Room messages fetched:", JSON.stringify(room, null, 2));
      return {
        ...room,
        messages: room.messages.length ? room.messages : [],
      } as IConversation;
    } catch (error: any) {
      console.error("Error fetching room messages:", {
        message: error.message,
        roomId,
        stack: error.stack,
      });
      throw new Error(`Failed to fetch room messages: ${error.message}`);
    }
  }

  async getRoom(
    receiverId: string,
    senderId: string
  ): Promise<IConversation | null> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(receiverId) ||
        !mongoose.Types.ObjectId.isValid(senderId)
      ) {
        throw new Error("Invalid receiverId or senderId");
      }

      console.log(
        `Repository: Fetching room for receiverId: ${receiverId}, senderId: ${senderId}`
      );
      const room = await chatModel
        .findOne({
          participants: {
            $all: [
              new mongoose.Types.ObjectId(receiverId),
              new mongoose.Types.ObjectId(senderId),
            ],
          },
        })
        .populate({
          path: "participants",
          select: "_id username email profilePicture name",
        })
        .lean();

      console.log(
        "Room fetch result:",
        room ? JSON.stringify(room, null, 2) : "No room found"
      );
      return room ? (room as IConversation) : null;
    } catch (error: any) {
      console.error("Repository: Error fetching room:", {
        message: error.message,
        receiverId,
        senderId,
        stack: error.stack,
      });
      throw new Error(`Failed to fetch room: ${error.message}`);
    }
  }

  async createRoom(
    receiverId: string,
    senderId: string
  ): Promise<IConversation> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(receiverId) ||
        !mongoose.Types.ObjectId.isValid(senderId)
      ) {
        throw new Error("Invalid receiverId or senderId");
      }

      console.log(
        `Repository: Creating room for receiverId: ${receiverId}, senderId: ${senderId}`
      );

      const [receiverTutor, receiverStudent, senderTutor, senderStudent] =
        await Promise.all([
          tutorRepo.findById(receiverId),
          studentRepo.findById(receiverId),
          tutorRepo.findById(senderId),
          studentRepo.findById(senderId),
        ]);

      const receiver = receiverTutor || receiverStudent;
      const sender = senderTutor || senderStudent;

      if (!receiver || !sender) {
        throw new Error("Participant not found");
      }

      const receiverType = receiverTutor ? "Tutor" : "Student";
      const senderType = senderTutor ? "Tutor" : "Student";

      const roomName = `${receiver.name || "Unknown"} & ${
        sender.name || "Unknown"
      }`;

      const room = await chatModel.create({
        participants: [
          new mongoose.Types.ObjectId(receiverId),
          new mongoose.Types.ObjectId(senderId),
        ],
        participantsRef: [receiverType, senderType],
        messages: [],
        name: roomName,
        profilePicture:
          receiver.profilePicture || sender.profilePicture || null,
      });

      await room.populate({
        path: "participants",
        select: "_id username email profilePicture name",
      });

      console.log("Room created:", JSON.stringify(room.toObject(), null, 2));
      return room.toObject() as IConversation;
    } catch (error: any) {
      console.error("Repository: Error creating room:", {
        message: error.message,
        receiverId,
        senderId,
        stack: error.stack,
      });
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  async getRoomById(
    roomId: string,
    userId: string
  ): Promise<IConversation | null> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(roomId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        throw new Error("Invalid roomId or userId");
      }

      console.log(
        `Repository: Fetching room by roomId: ${roomId}, userId: ${userId}`
      );
      const room = await chatModel
        .findOne({
          _id: roomId,
          participants: new mongoose.Types.ObjectId(userId),
        })
        .populate({
          path: "participants",
          select: "_id username email profilePicture name",
        })
        .populate({
          path: "messages",
          select:
            "_id senderId message message_time message_type isRead chatId",
        })
        .lean();

      if (!room) {
        console.error(`Room not found: ${roomId} for user: ${userId}`);
        return null;
      }

      console.log("Room fetched:", JSON.stringify(room, null, 2));
      return room as IConversation;
    } catch (error: any) {
      console.error("Repository: Error fetching room by ID:", {
        message: error.message,
        roomId,
        userId,
        stack: error.stack,
      });
      throw new Error(`Failed to fetch room: ${error.message}`);
    }
  }

  async getChats(
    query: FilterQuery<IConversation>,
    userId: string
  ): Promise<IChatData[] | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid userId");
      }

      console.log(`Fetching chats for userId: ${userId}, query:`, query);
      const chatData = await chatModel.aggregate([
        {
          $match: {
            participants: new mongoose.Types.ObjectId(userId),
            ...query,
          },
        },
        { $unwind: "$participants" },
        {
          $match: {
            participants: {
              $ne: new mongoose.Types.ObjectId(userId),
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
            name: {
              $cond: {
                if: { $gt: [{ $size: "$tutor" }, 0] },
                then: {
                  $let: {
                    vars: { tutor: { $arrayElemAt: ["$tutor", 0] } },
                    in: {
                      $ifNull: ["$$tutor.name", "$$tutor.username", "Unknown"],
                    },
                  },
                },
                else: {
                  $let: {
                    vars: { student: { $arrayElemAt: ["$student", 0] } },
                    in: {
                      $ifNull: [
                        "$$student.name",
                        "$$student.username",
                        "Unknown",
                      ],
                    },
                  },
                },
              },
            },
            profilePicture: {
              $cond: {
                if: { $gt: [{ $size: "$tutor" }, 0] },
                then: {
                  $let: {
                    vars: { tutor: { $arrayElemAt: ["$tutor", 0] } },
                    in: { $ifNull: ["$$tutor.profilePicture", null] },
                  },
                },
                else: {
                  $let: {
                    vars: { student: { $arrayElemAt: ["$student", 0] } },
                    in: { $ifNull: ["$$student.profilePicture", null] },
                  },
                },
              },
            },
            chatId: "$_id",
            lastMessage: {
              $cond: {
                if: { $gt: [{ $size: "$lastMessageData" }, 0] },
                then: { $arrayElemAt: ["$lastMessageData", 0] },
                else: null,
              },
            },
          },
        },
      ]);

      console.log("Chats fetched:", JSON.stringify(chatData, null, 2));
      return chatData as IChatData[];
    } catch (error: any) {
      console.error("Error fetching chats:", {
        message: error.message,
        userId,
        query,
        stack: error.stack,
      });
      throw new Error(`Failed to fetch chats: ${error.message}`);
    }
  }

  async getUnreadMessageCount(chatId: string, userId: string): Promise<number> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(chatId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        throw new Error("Invalid chatId or userId");
      }

      console.log(
        `Counting unread messages for chatId: ${chatId}, userId: ${userId}`
      );
      const chatCount = await MessageModel.countDocuments({
        chatId: new mongoose.Types.ObjectId(chatId),
        senderId: { $ne: new mongoose.Types.ObjectId(userId) },
        isRead: false,
      });

      console.log(`Unread message count: ${chatCount}`);
      return chatCount;
    } catch (error: any) {
      console.error("Error counting unread messages:", {
        message: error.message,
        chatId,
        userId,
        stack: error.stack,
      });
      throw new Error(`Failed to count unread messages: ${error.message}`);
    }
  }

  async getTutorChats(
    query: FilterQuery<IConversation>,
    tutorId: string
  ): Promise<IChatData[] | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(tutorId)) {
        throw new Error("Invalid tutorId");
      }

      console.log(
        `Fetching tutor chats for tutorId: ${tutorId}, query:`,
        query
      );
      const tutorData = await chatModel.aggregate([
        {
          $match: {
            participants: new mongoose.Types.ObjectId(tutorId),
            ...query,
          },
        },
        { $unwind: "$participants" },
        {
          $match: {
            participants: {
              $ne: new mongoose.Types.ObjectId(tutorId),
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
            from: "tutors",
            localField: "participants",
            foreignField: "_id",
            as: "tutor",
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
            name: {
              $cond: {
                if: { $gt: [{ $size: "$tutor" }, 0] },
                then: {
                  $let: {
                    vars: { tutor: { $arrayElemAt: ["$tutor", 0] } },
                    in: {
                      $ifNull: ["$$tutor.name", "$$tutor.username", "Unknown"],
                    },
                  },
                },
                else: {
                  $let: {
                    vars: { student: { $arrayElemAt: ["$student", 0] } },
                    in: {
                      $ifNull: [
                        "$$student.name",
                        "$$student.username",
                        "Unknown",
                      ],
                    },
                  },
                },
              },
            },
            profilePicture: {
              $cond: {
                if: { $gt: [{ $size: "$tutor" }, 0] },
                then: {
                  $let: {
                    vars: { tutor: { $arrayElemAt: ["$tutor", 0] } },
                    in: { $ifNull: ["$$tutor.profilePicture", null] },
                  },
                },
                else: {
                  $let: {
                    vars: { student: { $arrayElemAt: ["$student", 0] } },
                    in: { $ifNull: ["$$student.profilePicture", null] },
                  },
                },
              },
            },
            chatId: "$_id",
            lastMessage: {
              $cond: {
                if: { $gt: [{ $size: "$lastMessageData" }, 0] },
                then: { $arrayElemAt: ["$lastMessageData", 0] },
                else: null,
              },
            },
            unReadCount: {
              $let: {
                vars: {
                  unread: {
                    $filter: {
                      input: "$messages",
                      as: "msg",
                      cond: {
                        $and: [
                          {
                            $ne: [
                              "$$msg.senderId",
                              new mongoose.Types.ObjectId(tutorId),
                            ],
                          },
                          { $eq: ["$$msg.isRead", false] },
                        ],
                      },
                    },
                  },
                },
                in: { $size: "$$unread" },
              },
            },
            lastMessageRead: {
              $cond: {
                if: { $gt: [{ $size: "$lastMessageData" }, 0] },
                then: { $arrayElemAt: ["$lastMessageData.isRead", 0] },
                else: true,
              },
            },
            isOnline: { $literal: false },
          },
        },
      ]);

      console.log("Tutor chats fetched:", JSON.stringify(tutorData, null, 2));
      return tutorData as IChatData[];
    } catch (error: any) {
      console.error("Error fetching tutor chats:", {
        message: error.message,
        tutorId,
        query,
        stack: error.stack,
      });
      throw new Error(`Failed to fetch tutor chats: ${error.message}`);
    }
  }

  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(chatId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        throw new Error("Invalid chatId or userId");
      }

      console.log(
        `Repository: Marking messages as read for chatId: ${chatId}, userId: ${userId}`
      );
      const result = await MessageModel.updateMany(
        {
          chatId: new mongoose.Types.ObjectId(chatId),
          senderId: { $ne: new mongoose.Types.ObjectId(userId) },
          isRead: false,
        },
        {
          $set: { isRead: true },
        }
      );

      console.log(
        `Repository: Marked ${result.modifiedCount} messages as read for chatId: ${chatId}, userId: ${userId}`
      );
    } catch (error: any) {
      console.error("Repository: Error marking messages as read:", {
        message: error.message,
        chatId,
        userId,
        stack: error.stack,
      });
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }
  }
}

export default new ChatRepository();
