import mongoose, { FilterQuery } from "mongoose";
import {
  IChatData,
  IChatRepository,
  IConversation,
  IMessage,
} from "../interface/IConversation.js";
import chatModel from "../models/chatModel.js";
import MessageModel from "../models/messageModel.js";
import { CustomError } from "../domain/errors/customError.js";
import HttpStatusCode from "../domain/enum/httpstatus.js";
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
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(senderId)) {
      throw new CustomError("Invalid roomId or senderId", HttpStatusCode.BAD_REQUEST);
    }

    // Validate message_type
    const allowedMessageTypes = ["text", "image", "video", "file"];
    if (!allowedMessageTypes.includes(message_type)) {
      throw new CustomError("Invalid message_type", HttpStatusCode.BAD_REQUEST);
    }

    // Check if conversation exists
    const conversation = await chatModel.findById(roomId).lean();
    if (!conversation) {
      throw new CustomError("Chat room not found", HttpStatusCode.NOT_FOUND);
    }

    // Check if senderId is a participant
    if (!conversation.participants.some((p: any) => p.toString() === senderId)) {
      throw new CustomError(
        "Sender is not a participant in this conversation",
        HttpStatusCode.FORBIDDEN
      );
    }

    console.log(`Repository: Saving message for roomId: ${roomId}, senderId: ${senderId}`);

    // Create message
    const newMessage = await MessageModel.create({
      chatId: new mongoose.Types.ObjectId(roomId),
      senderId: new mongoose.Types.ObjectId(senderId),
      message,
      message_time,
      message_type,
      isRead: false,
    });

    // Update conversation
    const updatedChat = await chatModel.findByIdAndUpdate(
      roomId,
      {
        $push: { messages: newMessage._id },
        $set: { lastMessage: newMessage._id },
      },
      { new: true }
    );

    if (!updatedChat) {
      throw new CustomError("Failed to update chat room", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }

    console.log("Message saved:", JSON.stringify(newMessage.toObject(), null, 2));
    return newMessage.toObject() as IMessage;
  } catch (error: any) {
    console.error("Repository: Error saving message:", {
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

  async getMessagesByRoom(roomId: string): Promise<IConversation> {
    try {
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        throw new CustomError("Invalid roomId", HttpStatusCode.BAD_REQUEST);
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
        throw new CustomError("Room not found", HttpStatusCode.NOT_FOUND);
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

  async getRoom(receiverId: string, senderId: string): Promise<IConversation | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(receiverId) || !mongoose.Types.ObjectId.isValid(senderId)) {
        throw new CustomError("Invalid receiverId or senderId", HttpStatusCode.BAD_REQUEST);
      }

      console.log(`Repository: Fetching room for receiverId: ${receiverId}, senderId: ${senderId}`);
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

      console.log("Room fetch result:", room ? JSON.stringify(room, null, 2) : "No room found");
      return room ? (room as IConversation) : null;
    } catch (error: any) {
      console.error("Repository: Error fetching room:", {
        message: error.message,
        receiverId,
        senderId,
        code: error.code,
        stack: error.stack,
      });
      throw new CustomError(
        `Failed to fetch room: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createRoom(receiverId: string, senderId: string): Promise<IConversation> {
    try {
      // Validate ObjectIds
      if (!mongoose.Types.ObjectId.isValid(receiverId) || !mongoose.Types.ObjectId.isValid(senderId)) {
        throw new CustomError("Invalid receiverId or senderId", HttpStatusCode.BAD_REQUEST);
      }

      console.log(`Repository: Creating room for receiverId: ${receiverId}, senderId: ${senderId}`);

      // Fetch participants
      const [receiverTutor, receiverStudent, senderTutor, senderStudent] = await Promise.all([
        tutorRepo.findById(receiverId),
        studentRepo.findById(receiverId),
        tutorRepo.findById(senderId),
        studentRepo.findById(senderId),
      ]);

      const receiver = receiverTutor || receiverStudent;
      const sender = senderTutor || senderStudent;

      if (!receiver || !sender) {
        throw new CustomError("Participant not found", HttpStatusCode.NOT_FOUND);
      }

      // Determine participant types
      const receiverType = receiverTutor ? "Tutor" : "Student";
      const senderType = senderTutor ? "Tutor" : "Student";

      // Create room name
      const roomName = `${receiver.name || "Unknown"} & ${sender.name || "Unknown"}`;

      // Create conversation
      const room = await chatModel.create({
        participants: [
          new mongoose.Types.ObjectId(receiverId),
          new mongoose.Types.ObjectId(senderId),
        ],
        participantsRef: [receiverType, senderType],
        messages: [],
        name: roomName,
        profilePicture: receiver.profilePicture || sender.profilePicture || null,
      });

      // Populate participants
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
        code: error.code,
        stack: error.stack,
      });
      throw error instanceof CustomError
        ? error
        : new CustomError(
            `Failed to create room: ${error.message}`,
            HttpStatusCode.INTERNAL_SERVER_ERROR
          );
    }
  }
  async getRoomById(roomId: string, userId: string): Promise<IConversation | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid roomId or userId", HttpStatusCode.BAD_REQUEST);
      }

      console.log(`Repository: Fetching room by roomId: ${roomId}, userId: ${userId}`);
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
          select: "_id senderId message message_time message_type isRead chatId",
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
        code: error.code,
        stack: error.stack,
      });
      throw new CustomError(
        `Failed to fetch room: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

 async getChats(query: FilterQuery<IConversation>, userId: string): Promise<IChatData[] | null> {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new CustomError("Invalid userId", HttpStatusCode.BAD_REQUEST);
    }

    console.log(`Fetching chats for userId: ${userId}, query:`, query);
    const chatData = await chatModel.aggregate([
      { $match: { participants: new mongoose.Types.ObjectId(userId), ...query } },
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
                  in: { $ifNull: ["$$tutor.name", "$$tutor.username", "Unknown"] },
                },
              },
              else: {
                $let: {
                  vars: { student: { $arrayElemAt: ["$student", 0] } },
                  in: { $ifNull: ["$$student.name", "$$student.username", "Unknown"] },
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
              then: { $arrayElemAt: ["$lastMessageData", 0] }, // Changed to return the entire message object
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

  async getUnreadMessageCount(chatId: string, userId: string): Promise<number> {
    try {
      if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new CustomError("Invalid chatId or userId", HttpStatusCode.BAD_REQUEST);
      }

      console.log(`Counting unread messages for chatId: ${chatId}, userId: ${userId}`);
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
        code: error.code,
        stack: error.stack,
      });
      throw error instanceof CustomError
        ? error
        : new CustomError(
            `Failed to count unread messages: ${error.message}`,
            HttpStatusCode.INTERNAL_SERVER_ERROR
          );
    }
  }

  async getTutorChats(query: FilterQuery<IConversation>, tutorId: string): Promise<IChatData[] | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(tutorId)) {
        throw new CustomError("Invalid tutorId", HttpStatusCode.BAD_REQUEST);
      }

      console.log(`Fetching tutor chats for tutorId: ${tutorId}, query:`, query);
      const tutorData = await chatModel.aggregate([
        { $match: { participants: new mongoose.Types.ObjectId(tutorId), ...query } },
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
                    in: { $ifNull: ["$$tutor.name", "$$tutor.username", "Unknown"] },
                  },
                },
                else: {
                  $let: {
                    vars: { student: { $arrayElemAt: ["$student", 0] } },
                    in: { $ifNull: ["$$student.name", "$$student.username", "Unknown"] },
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
                then: { $arrayElemAt: ["$lastMessageData.message", 0] },
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
                          { $ne: ["$$msg.senderId", new mongoose.Types.ObjectId(tutorId)] },
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

export default new ChatRepository();