import { ISocketController, ISocketService } from "../../interface/IConversation.js";
import { Socket, Server as SocketIOServer } from "socket.io";

enum SocketEvent {
  GetOnlineUsers = "getOnlineUsers",
  JoinedRoom = "joined-room",
  Message = "message",
  NewBadge = "newBadge",
  NewMessage = "new-message",
  ToTheAdmin = "toTheAdmin",
  ToTheTutor = "toTheTutor",
  ToTutor = "toTutor",
  ToUsers = "toUsers",
  ToTheUser = "toTheUser",
  ShowNotification = "showNotification",
  OutgoingVideoCall = "outgoing-video-call",
  IncomingVideoCall = "incoming-video-call",
  AcceptIncomingCall = "accept-incoming-call",
  RejectCall = "reject-call",
  TutorCallAccept = "tutor-call-accept",
  MarkMessagesRead = "mark-messages-read",
  MessageRead = "message-read",
}

interface VideoCallData {
  to: string;
  from: string;
  tutorName?: string;
  tutorImage?: string;
  studentName?: string;
  studentImage?: string;
  callType: string;
  roomId: string;
}

export default class SocketController implements ISocketController {
  private chatService: ISocketService;
  private _io: SocketIOServer;
  private _userSocketMap: Map<string, string>;
  private _tutorSocketMap: Map<string, string>;
  private _adminSocketMap: Map<string, string>;

  constructor(chatService: ISocketService, io: SocketIOServer) {
    this.chatService = chatService;
    this._io = io;
    this._userSocketMap = new Map();
    this._tutorSocketMap = new Map();
    this._adminSocketMap = new Map();
  }

  private getReceiverSocketId(userId: string): string | undefined {
    return (
      this._userSocketMap.get(userId) ||
      this._tutorSocketMap.get(userId) ||
      this._adminSocketMap.get(userId)
    );
  }

  private emitOnlineUsers(): void {
    const onlineUsers = [
      ...Array.from(this._userSocketMap.keys()),
      ...Array.from(this._tutorSocketMap.keys()),
      ...Array.from(this._adminSocketMap.keys()),
    ];
    console.log("Emitting getOnlineUsers:", JSON.stringify(onlineUsers, null, 2));
    this._io.to("user-room").emit(SocketEvent.GetOnlineUsers, onlineUsers);
    this._io.to("tutor-room").emit(SocketEvent.GetOnlineUsers, onlineUsers);
    this._io.to("admin-room").emit(SocketEvent.GetOnlineUsers, onlineUsers);
  }

  onConnection(socket: Socket) {
    console.log(`Client connected: ${socket.handshake.query.userId} with socket ID: ${socket.id}`);
    const userId = socket.handshake.query.userId as string;
    const role = socket.handshake.query.role as string;

    if (!userId || !role) {
      console.error("Missing userId or role in handshake", { userId, role, socketId: socket.id });
      socket.disconnect();
      return;
    }

    switch (role) {
      case "user":
        this._userSocketMap.set(userId, socket.id);
        socket.join("user-room");
        break;
      case "tutor":
        this._tutorSocketMap.set(userId, socket.id);
        socket.join("tutor-room");
        break;
      case "admin":
        this._adminSocketMap.set(userId, socket.id);
        socket.join("admin-room");
        break;
      default:
        console.error(`Invalid role: ${role}`);
        socket.disconnect();
        return;
    }

    // Emit online users to all rooms
    this.emitOnlineUsers();

    socket.on("register-user", (data: { userId: string; role: string }) => {
      console.log(`Registering user: ${data.userId} as ${data.role} with socket ID: ${socket.id}`);
      if (data.userId && data.role) {
        switch (data.role) {
          case "user":
            this._userSocketMap.set(data.userId, socket.id);
            socket.join("user-room");
            break;
          case "tutor":
            this._tutorSocketMap.set(data.userId, socket.id);
            socket.join("tutor-room");
            break;
          case "admin":
            this._adminSocketMap.set(data.userId, socket.id);
            socket.join("admin-room");
            break;
          default:
            console.error(`Invalid role in register-user: ${data.role}`);
        }
        // Emit online users after registration
        this.emitOnlineUsers();
      }
    });

    socket.on(SocketEvent.JoinedRoom, async (roomId: string) => {
      if (!roomId) {
        console.error("Invalid roomId provided", { socketId: socket.id, userId });
        socket.emit("error", { message: "Invalid roomId" });
        return;
      }
      console.log(`Client ${userId} joined room: ${roomId} with socket ID: ${socket.id}`);
      socket.join(roomId);
      socket.emit("joined-room-ack", { roomId });
    });

    socket.on(SocketEvent.Message, async (data: any) => {
      console.log("Received message:", JSON.stringify(data, null, 2));
      const { roomId, recieverId, senderId, message, message_time, message_type, isRead } = data;

      const missingFields: string[] = [];
      if (!roomId) missingFields.push("roomId");
      if (!recieverId) missingFields.push("recieverId");
      if (!senderId) missingFields.push("senderId");
      if (!message) missingFields.push("message");
      if (!message_time) missingFields.push("message_time");

      if (missingFields.length > 0) {
        console.error(`Invalid message data. Missing: ${missingFields.join(", ")}`, {
          data,
          userId,
          socketId: socket.id,
        });
        socket.emit("error", {
          message: `Invalid message data: ${missingFields.join(", ")}`,
          fields: missingFields,
        });
        return;
      }

      try {
        const savedMessage = await this.chatService.saveMessage(
          roomId,
          senderId,
          message,
          new Date(message_time),
          message_type || "text",
          isRead || false
        );

        if (!savedMessage) {
          console.error("Failed to save message:", { data, userId, socketId: socket.id });
          socket.emit("error", { message: "Failed to save message" });
          return;
        }

        console.log(`Emitting new-message to room ${roomId}:`, JSON.stringify(savedMessage, null, 2));
        this._io.to(roomId).emit(SocketEvent.NewMessage, savedMessage);

        if (recieverId !== senderId && !savedMessage.isRead) {
          const receiverSocketId = this.getReceiverSocketId(recieverId);
          if (receiverSocketId) {
            console.log(`Emitting newBadge to receiver ${recieverId} (socket: ${receiverSocketId})`);
            this._io.to(receiverSocketId).emit(SocketEvent.NewBadge, savedMessage);
          }
        }
      } catch (error: any) {
        console.error("Error processing message:", {
          message: error.message,
          stack: error.stack,
          data,
          userId,
          socketId: socket.id,
        });
        socket.emit("error", {
          message: "Failed to process message",
          error: error.message,
        });
      }
    });

    socket.on(SocketEvent.MarkMessagesRead, async (data: { chatId: string; userId: string }) => {
      console.log("Received mark-messages-read:", JSON.stringify(data, null, 2));
      const { chatId, userId } = data;

      if (!chatId || !userId) {
        console.error("Invalid mark-messages-read data", { chatId, userId, socketId: socket.id });
        socket.emit("error", { message: "Invalid chatId or userId" });
        return;
      }

      try {
        const messagesMarked = await this.chatService.markMessagesAsRead(chatId, userId);
        if (messagesMarked) {
          console.log(`Emitting message-read to room ${chatId}:`, JSON.stringify({ chatId, userId }, null, 2));
          this._io.to(chatId).emit(SocketEvent.MessageRead, { chatId, userId });
        } else {
          console.log(`No messages were marked as read for chatId: ${chatId}`);
        }
      } catch (error: any) {
        console.error("Error marking messages as read:", {
          message: error.message,
          stack: error.stack,
          data,
          userId,
          socketId: socket.id,
        });
        socket.emit("error", {
          message: "Failed to mark messages as read",
          error: error.message,
        });
      }
    });

    socket.on(SocketEvent.OutgoingVideoCall, async (data: VideoCallData) => {
      console.log("Received outgoing-video-call:", JSON.stringify(data, null, 2));
      const { to, from, tutorName, tutorImage, studentName, studentImage, callType, roomId } = data;

      const missingFields: string[] = [];
      if (!to) missingFields.push("to");
      if (!from) missingFields.push("from");
      if (!roomId) missingFields.push("roomId");
      if (!callType) missingFields.push("callType");

      if (missingFields.length > 0) {
        console.error(`Invalid outgoing video call data. Missing: ${missingFields.join(", ")}`, {
          data,
          userId,
          socketId: socket.id,
        });
        socket.emit("error", {
          message: `Invalid video call data. Missing: ${missingFields.join(", ")}`,
          fields: missingFields,
        });
        return;
      }

      try {
        const studentSocketId = this._userSocketMap.get(to);
        if (!studentSocketId) {
          console.warn(`Student ${to} is not online`, { userId: to });
          socket.emit(SocketEvent.RejectCall, {
            to: from,
            sender: "system",
            message: "Student is not online",
          });
          return;
        }

        const videoCallPayload = {
          _id: to,
          from,
          tutorId: from,
          tutorName: tutorName || "Unknown Tutor",
          tutorImage: tutorImage || "/logos/avatar.avif",
          studentName: studentName || "Unknown Student",
          studentImage: studentImage || "/logos/avatar.avif",
          callType,
          roomId,
        };

        console.log(
          `Emitting incoming-video-call to student ${to} (socket: ${studentSocketId}):`,
          JSON.stringify(videoCallPayload, null, 2)
        );
        this._io.to(studentSocketId).emit(SocketEvent.IncomingVideoCall, videoCallPayload);
      } catch (error: any) {
        console.error("Error processing outgoing video call:", {
          message: error.message,
          stack: error.stack,
          data,
          userId,
          socketId: socket.id,
        });
        socket.emit("error", {
          message: "Failed to process video call",
          error: error.message,
        });
      }
    });

    socket.on(SocketEvent.AcceptIncomingCall, async (data: { to: string; from: string; roomId: string }) => {
      console.log("Received accept-incoming-call:", JSON.stringify(data, null, 2));
      const { to, from, roomId } = data;

      const missingFields: string[] = [];
      if (!to) missingFields.push("to");
      if (!from) missingFields.push("from");
      if (!roomId) missingFields.push("roomId");

      if (missingFields.length > 0) {
        console.error(`Invalid accept incoming call data. Missing: ${missingFields.join(", ")}`, {
          data,
          userId,
          socketId: socket.id,
        });
        socket.emit("error", {
          message: `Invalid accept call data. Missing: ${missingFields.join(", ")}`,
          fields: missingFields,
        });
        return;
      }

      try {
        const tutorSocketId = this._tutorSocketMap.get(to);
        const studentSocketId = this._userSocketMap.get(from);

        if (!tutorSocketId) {
          console.warn(`Tutor ${to} is not online`, { userId: to });
          socket.emit(SocketEvent.RejectCall, {
            to: from,
            sender: "system",
            message: "Tutor is not online",
          });
          return;
        }

        if (!studentSocketId) {
          console.warn(`Student ${from} is not online`, { userId: from });
          socket.emit(SocketEvent.RejectCall, {
            to: to,
            sender: "system",
            message: "Student is not online",
          });
          return;
        }

        const callAcceptPayload = { roomId, from, tutorId: to };
        console.log(`Emitting tutor-call-accept to tutor ${to} and student ${from}:`, JSON.stringify(callAcceptPayload, null, 2));
        this._io.to(tutorSocketId).emit(SocketEvent.TutorCallAccept, callAcceptPayload);
        this._io.to(studentSocketId).emit(SocketEvent.TutorCallAccept, callAcceptPayload);

        const message = await this.chatService.saveMessage(
          roomId,
          from,
          "Video call initiated",
          new Date(),
          "video-call"
        );

        if (message) {
          console.log(`Emitting new-message for video call to room ${roomId}:`, JSON.stringify(message, null, 2));
          this._io.to(roomId).emit(SocketEvent.NewMessage, message);
        }
      } catch (error: any) {
        console.error("Error processing accept incoming call:", {
          message: error.message,
          stack: error.stack,
          data,
          userId,
          socketId: socket.id,
        });
        socket.emit("error", {
          message: "Failed to process call acceptance",
          error: error.message,
        });
      }
    });

    socket.on(SocketEvent.RejectCall, async (data: { to: string; sender: string; name?: string; from?: string }) => {
      console.log("Received reject-call:", JSON.stringify(data, null, 2));
      const { to, sender, name, from } = data;

      if (!to || !sender) {
        console.error(
          `Invalid reject call data. Missing: ${!to ? "to" : ""} ${!sender ? "sender" : ""}`,
          { data, userId, socketId: socket.id }
        );
        socket.emit("error", { message: "Invalid call data" });
        return;
      }

      try {
        let targetSocketId: string | undefined;
        if (sender === "student" || sender === "user") {
          targetSocketId = this._tutorSocketMap.get(to);
          console.log(`Student rejected call, notifying tutor ${to}`);
        } else if (sender === "tutor") {
          targetSocketId = this._userSocketMap.get(to);
          console.log(`Tutor rejected call, notifying student ${to}`);
        } else {
          console.error(`Unknown sender type: ${sender}`);
          socket.emit("error", { message: "Invalid sender type" });
          return;
        }

        if (!targetSocketId) {
          console.warn(`Target ${to} is not online for reject call`, {
            userId: to,
            sender,
          });
          return;
        }

        const rejectionPayload = {
          to,
          sender,
          name: name || sender,
          from: from || userId,
          message: `Call ${sender === "student" || sender === "user" ? "rejected" : "ended"} by ${name || sender}`,
        };

        console.log(`Emitting reject-call to ${to} (socket: ${targetSocketId}):`, JSON.stringify(rejectionPayload, null, 2));
        this._io.to(targetSocketId).emit(SocketEvent.RejectCall, rejectionPayload);

        socket.emit(SocketEvent.RejectCall, {
          ...rejectionPayload,
          message: "Call ended successfully",
        });
      } catch (error: any) {
        console.error("Error processing reject call:", {
          message: error.message,
          stack: error.stack,
          data,
          userId,
          socketId: socket.id,
        });
        socket.emit("error", {
          message: "Failed to process call rejection",
          error: error.message,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${userId} with socket ID: ${socket.id}`);
      this.removeSocket(userId, role);
      this.emitOnlineUsers();
    });
  }

  private removeSocket(userId: string, role: string): void {
    switch (role) {
      case "user":
        this._userSocketMap.delete(userId);
        break;
      case "tutor":
        this._tutorSocketMap.delete(userId);
        break;
      case "admin":
        this._adminSocketMap.delete(userId);
        break;
      default:
        console.error(`Invalid role during removal: ${role}`);
    }
  }

  private emitToAdmins(event: string, data: any): void {
    for (const [_, socketId] of this._adminSocketMap) {
      this._io.to(socketId).emit(event, data);
    }
  }

  public getOnlineUsersCount(): { users: number; tutors: number; admins: number } {
    return {
      users: this._userSocketMap.size,
      tutors: this._tutorSocketMap.size,
      admins: this._adminSocketMap.size,
    };
  }

  public isUserOnline(userId: string, role: string): boolean {
    switch (role) {
      case "user":
        return this._userSocketMap.has(userId);
      case "tutor":
        return this._tutorSocketMap.has(userId);
      case "admin":
        return this._adminSocketMap.has(userId);
      default:
        return false;
    }
  }
}