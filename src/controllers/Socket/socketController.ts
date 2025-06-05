// src/controllers/Socket/socketController.ts
import { ISocketController, ISocketService } from "../../interface/IConversation.js";
import { Socket, Server as SocketIOServer } from "socket.io";

enum SocketEvent {
  GetOnlineUsers = "getOnlineUsers",
  JoinedRoom = "joinedRoom",
  Message = "message",
  NewBadge = "newBadge",
  NewMessage = "newMessage",
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

  onConnection(socket: Socket) {
    console.log(`Client connected: ${socket.handshake.query.userId}`);
    const userId = socket.handshake.query.userId as string;
    const role = socket.handshake.query.role as string;

    if (!userId || !role) {
      console.error("Missing userId or role in handshake", { userId, role });
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

    socket.emit(SocketEvent.GetOnlineUsers, Array.from(this._userSocketMap.keys()));
    this._io.to("user-room").emit(SocketEvent.GetOnlineUsers, Array.from(this._userSocketMap.keys()));

    socket.on("register-user", (data: { userId: string; role: string }) => {
      console.log(`Registering user: ${data.userId} as ${data.role}`);
      if (data.userId && data.role) {
        switch (data.role) {
          case "user":
            this._userSocketMap.set(data.userId, socket.id);
            break;
          case "tutor":
            this._tutorSocketMap.set(data.userId, socket.id);
            break;
          case "admin":
            this._adminSocketMap.set(data.userId, socket.id);
            break;
          default:
            console.error(`Invalid role in register-user: ${data.role}`);
        }
        console.log(`Updated socket maps:`, {
          users: Array.from(this._userSocketMap.keys()),
          tutors: Array.from(this._tutorSocketMap.keys()),
          admins: Array.from(this._adminSocketMap.keys()),
        });
      }
    });

    socket.on(SocketEvent.JoinedRoom, async (roomId: string) => {
      if (!roomId) {
        console.error("Invalid roomId provided");
        socket.emit("error", { message: "Invalid roomId" });
        return;
      }
      console.log(`Client ${userId} joined room: ${roomId}`);
      socket.join(roomId);
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
        console.error(`Invalid outgoing video call data. Missing fields: ${missingFields.join(", ")}`, {
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

      if (to === from) {
        console.error("Invalid video call: Cannot call yourself", { to, from });
        socket.emit("error", { message: "Cannot initiate video call to yourself" });
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
          _id: to, // Student ID
          from: from, // Tutor ID
          tutorId: from, // Explicitly include tutorId
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
        if (!tutorSocketId) {
          console.warn(`Tutor ${to} is not online`, { userId: to });
          socket.emit(SocketEvent.RejectCall, {
            to: from,
            sender: "system",
            message: "Tutor is not online",
          });
          return;
        }

        this._io.to(tutorSocketId).emit(SocketEvent.TutorCallAccept, { from, roomId, tutorId: to });
        console.log(`Emitted tutor-call-accept to tutor ${to}:`, { from, roomId });

        const message = await this.chatService.saveMessage(
          roomId,
          from,
          "Video call initiated",
          new Date(),
          "video-call"
        );

        if (message) {
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

    socket.on(SocketEvent.TutorCallAccept, async (data: { tutorId: string; from: string; roomId: string }) => {
      console.log("Received tutor-call-accept:", JSON.stringify(data, null, 2));

      const missingFields: string[] = [];
      if (!data.tutorId) missingFields.push("tutorId");
      if (!data.from) missingFields.push("from");
      if (!data.roomId) missingFields.push("roomId");

      if (missingFields.length > 0) {
        console.error(`Invalid tutor-call-accept data. Missing: ${missingFields.join(", ")}`, {
          data,
          userId,
          socketId: socket.id,
        });
        socket.emit("error", {
          message: `Invalid tutor-call-accept data. Missing: ${missingFields.join(", ")}`,
          fields: missingFields,
        });
        return;
      }

      try {
        const studentSocketId = this._userSocketMap.get(data.from);
        if (!studentSocketId) {
          console.warn(`Student ${data.from} is not online`, { userId: data.from });
          socket.emit("error", { message: `Student ${data.from} is not online` });
          return;
        }

        this._io.to(studentSocketId).emit(SocketEvent.TutorCallAccept, { roomId: data.roomId });
        console.log(`Emitted tutor-call-accept to student ${data.from}:`, { roomId: data.roomId });
      } catch (error: any) {
        console.error("Error processing tutor-call-accept:", {
          message: error.message,
          stack: error.stack,
          data,
          userId,
          socketId: socket.id,
        });
        socket.emit("error", {
          message: "Failed to process tutor call acceptance",
          error: error.message,
        });
      }
    });

    // Fixed reject-call handler in socketController.ts

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
    // Determine the correct socket map based on sender
    let targetSocketId: string | undefined;
    
    if (sender === "student" || sender === "user") {
      // Student/user is rejecting, send to tutor
      targetSocketId = this._tutorSocketMap.get(to);
      console.log(`Student rejected call, notifying tutor ${to}`);
    } else if (sender === "tutor") {
      // Tutor is rejecting, send to student/user
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
        userMap: Array.from(this._userSocketMap.keys()),
        tutorMap: Array.from(this._tutorSocketMap.keys())
      });
      return;
    }

    // Emit the rejection to the target
    const rejectionPayload = {
      ...data,
      message: `Call ${sender === "student" || sender === "user" ? "rejected" : "ended"} by ${name || sender}`,
    };

    this._io.to(targetSocketId).emit(SocketEvent.RejectCall, rejectionPayload);
    console.log(`Emitted reject-call to ${to} from ${sender}:`, rejectionPayload);

    // Also emit to the sender to confirm the rejection was processed
    socket.emit(SocketEvent.RejectCall, {
      ...rejectionPayload,
      message: "Call ended successfully"
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

    socket.on(SocketEvent.Message, async (data: any) => {
      console.log("Received message:", JSON.stringify(data, null, 2));
      const { roomId, recieverId, senderId, message, message_time, message_type } = data;

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
          message_type || "text"
        );

        if (!savedMessage) {
          console.error("Failed to save message:", { data, userId, socketId: socket.id });
          socket.emit("error", { message: "Failed to save message" });
          return;
        }

        if (recieverId !== senderId) {
          const receiverSocketId = this.getReceiverSocketId(recieverId);
          if (receiverSocketId) {
            this._io.to(receiverSocketId).emit(SocketEvent.NewBadge, savedMessage);
          }
        }

        this._io.to(String(savedMessage.chatId)).emit(SocketEvent.NewMessage, savedMessage);
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

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${userId}`);
      this.removeSocket(userId, role); // Fixed typo: changed removeSocketId to removeSocket
      if (role === "user") {
        this._io.to("user-room").emit(SocketEvent.GetOnlineUsers, Array.from(this._userSocketMap.keys()));
      }
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