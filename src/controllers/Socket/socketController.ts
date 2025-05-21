import {
  ISocketController,
  ISocketService,
} from "../../interface/IConversation.js";
import { Socket, Server as SocketIOServer } from "socket.io";
import SocketEvent from "../../domain/enum/socketevent.js";
// import { INotification } from "../../interface/INotification.js";

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

  onConnection(socket: Socket) {
    console.log(`Client connected: ${socket.handshake.query.userId}`);
    const userId = socket.handshake.query.userId as string;
    const role = socket.handshake.query.role as string;

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
        return;
    }

    socket.emit(
      SocketEvent.GetOnlineUsers,
      Array.from(this._userSocketMap.keys())
    );

    socket.on(SocketEvent.JoinedRoom, async (roomId) => {
      console.log(`Client joined room: ${roomId}`);
      socket.join(roomId);
    });

    socket.on(SocketEvent.Message, async (data) => {
      const {
        roomId,
        recieverId,
        senderId,
        message,
        message_time,
        message_type,
      } = data;
      // Validate inputs
      if (!roomId || !recieverId || !senderId || !message || !message_time) {
        console.error("Invalid message data:", data);
        return;
      }

      try {
        const savedMessage = await this.chatService.saveMessage(
          roomId,
          senderId,
          message,
          message_time,
          message_type
        );
        if (!savedMessage) {
          console.error("Failed to save message:", data);
          return;
        }

        // Handle recieverId as a string
        const toSocketId =
          recieverId !== senderId ? this._userSocketMap.get(recieverId) : null;
        if (toSocketId) {
          this._io.to(toSocketId).emit(SocketEvent.NewBadge, savedMessage);
        }

        // Emit message to room
        this._io
          .to(String(savedMessage.chatId))
          .emit(SocketEvent.NewMessage, savedMessage);
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    // socket.on(SocketEvent.InitiateVideoCall, ({ to, signalData, myId }) => {
    //   console.log("signalData", signalData, "myId", myId, "to", to);
    //   const toSocketId = this._userSocketMap.get(to);
    //   if (toSocketId) {
    //     this._io
    //       .to(toSocketId)
    //       .emit(SocketEvent.IncomingVideoCall, { signalData, from: myId });
    //   }
    // });

    // socket.on(SocketEvent.AnswerVideoCall, (data) => {
    //   const toSocketId = this._userSocketMap.get(data.to);
    //   if (toSocketId) {
    //     this._io.to(toSocketId).emit(SocketEvent.AcceptVideoCall, data.signal);
    //   }
    // });

    // socket.on(SocketEvent.EndVideoCall, ({ to }) => {
    //   const toSocketId = this._userSocketMap.get(to);
    //   if (toSocketId) {
    //     this._io.to(toSocketId).emit(SocketEvent.VideoCallEnded);
    //   }
    // });

    // socket.on(SocketEvent.AudioMute, ({ isMuted, reciever }) => {
    //   const toSocketId = this._userSocketMap.get(reciever);
    //   if (toSocketId) {
    //     socket.to(toSocketId).emit(SocketEvent.AudioMuted, { isMuted });
    //   }
    // });

    // socket.on(SocketEvent.VideoMute, ({ isMuted, reciever }) => {
    //   const toSocketId = this._userSocketMap.get(reciever);
    //   if (toSocketId) {
    //     socket.to(toSocketId).emit(SocketEvent.VideoMuted, { isMuted });
    //   }
    // });

    // socket.on(SocketEvent.ToTheAdmin, async (data: INotification) => {
    //   const Notification = await this.chatService.saveAdminNotification(data);
    //   this.emitToAdmins(SocketEvent.ShowNotification, Notification);
    // });

    // socket.on(SocketEvent.ToTheTutor, async (data) => {
    //   const Notification = await this.chatService.saveNotification(data);
    //   const to = Notification?.to?.toString();
    //   if (to) {
    //     const toSocketId = this._tutorSocketMap.get(to);
    //     if (toSocketId) {
    //       this._io
    //         .to(toSocketId)
    //         .emit(SocketEvent.ShowNotification, Notification);
    //     }
    //   }
    // });

    // socket.on(SocketEvent.ToTutor, async (data) => {
    //   const Notification = await this.chatService.saveNotification(data);
    //   for (const [_, socketId] of this._tutorSocketMap) {
    //     this._io.to(socketId).emit(SocketEvent.ShowNotification, Notification);
    //   }
    // });

    // socket.on(SocketEvent.ToUsers, async (data) => {
    //   const Notification = await this.chatService.saveNotification(data);
    //   for (const [_, socketId] of this._userSocketMap) {
    //     this._io.to(socketId).emit(SocketEvent.ShowNotification, Notification);
    //   }
    // });

    // socket.on(SocketEvent.ToTheUser, async (data) => {
    //   const Notification = await this.chatService.saveNotification(data);
    //   const to = Notification?.to?.toString();
    //   if (to) {
    //     const toSocketId = this._userSocketMap.get(to);
    //     if (toSocketId) {
    //       this._io
    //         .to(toSocketId)
    //         .emit(SocketEvent.ShowNotification, Notification);
    //     }
    //   }
    // });

    socket.on("disconnect", () => {
      this.removeSocket(userId, role);
    });
  }

  private removeSocket(userId: string, role: string) {
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
        console.error(`Invalid role: ${role}`);
    }
  }

  // emitToAdmins(event: string, data: INotification) {
  //   for (const [_, socketId] of this._adminSocketMap) {
  //     this._io.to(socketId).emit(event, data);
  //   }
  // }
}
