var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var SocketEvent;
(function (SocketEvent) {
    SocketEvent["GetOnlineUsers"] = "getOnlineUsers";
    SocketEvent["JoinedRoom"] = "joined-room";
    SocketEvent["Message"] = "message";
    SocketEvent["NewBadge"] = "newBadge";
    SocketEvent["NewMessage"] = "new-message";
    SocketEvent["ToTheAdmin"] = "toTheAdmin";
    SocketEvent["ToTheTutor"] = "toTheTutor";
    SocketEvent["ToTutor"] = "toTutor";
    SocketEvent["ToUsers"] = "toUsers";
    SocketEvent["ToTheUser"] = "toTheUser";
    SocketEvent["ShowNotification"] = "showNotification";
    SocketEvent["OutgoingVideoCall"] = "outgoing-video-call";
    SocketEvent["IncomingVideoCall"] = "incoming-video-call";
    SocketEvent["AcceptIncomingCall"] = "accept-incoming-call";
    SocketEvent["RejectCall"] = "reject-call";
    SocketEvent["TutorCallAccept"] = "tutor-call-accept";
    SocketEvent["MarkMessagesRead"] = "mark-messages-read";
    SocketEvent["MessageRead"] = "message-read";
})(SocketEvent || (SocketEvent = {}));
export default class SocketController {
    constructor(chatService, io) {
        this.chatService = chatService;
        this._io = io;
        this._userSocketMap = new Map();
        this._tutorSocketMap = new Map();
        this._adminSocketMap = new Map();
    }
    getReceiverSocketId(userId) {
        return (this._userSocketMap.get(userId) ||
            this._tutorSocketMap.get(userId) ||
            this._adminSocketMap.get(userId));
    }
    emitOnlineUsers() {
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
    onConnection(socket) {
        console.log(`Client connected: ${socket.handshake.query.userId} with socket ID: ${socket.id}`);
        const userId = socket.handshake.query.userId;
        const role = socket.handshake.query.role;
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
        socket.on("register-user", (data) => {
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
        socket.on(SocketEvent.JoinedRoom, (roomId) => __awaiter(this, void 0, void 0, function* () {
            if (!roomId) {
                console.error("Invalid roomId provided", { socketId: socket.id, userId });
                socket.emit("error", { message: "Invalid roomId" });
                return;
            }
            console.log(`Client ${userId} joined room: ${roomId} with socket ID: ${socket.id}`);
            socket.join(roomId);
            socket.emit("joined-room-ack", { roomId });
        }));
        socket.on(SocketEvent.Message, (data) => __awaiter(this, void 0, void 0, function* () {
            console.log("Received message:", JSON.stringify(data, null, 2));
            const { roomId, recieverId, senderId, message, message_time, message_type, isRead } = data;
            const missingFields = [];
            if (!roomId)
                missingFields.push("roomId");
            if (!recieverId)
                missingFields.push("recieverId");
            if (!senderId)
                missingFields.push("senderId");
            if (!message)
                missingFields.push("message");
            if (!message_time)
                missingFields.push("message_time");
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
                const savedMessage = yield this.chatService.saveMessage(roomId, senderId, message, new Date(message_time), message_type || "text", isRead || false);
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
            }
            catch (error) {
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
        }));
        socket.on(SocketEvent.MarkMessagesRead, (data) => __awaiter(this, void 0, void 0, function* () {
            console.log("Received mark-messages-read:", JSON.stringify(data, null, 2));
            const { chatId, userId } = data;
            if (!chatId || !userId) {
                console.error("Invalid mark-messages-read data", { chatId, userId, socketId: socket.id });
                socket.emit("error", { message: "Invalid chatId or userId" });
                return;
            }
            try {
                const messagesMarked = yield this.chatService.markMessagesAsRead(chatId, userId);
                if (messagesMarked) {
                    console.log(`Emitting message-read to room ${chatId}:`, JSON.stringify({ chatId, userId }, null, 2));
                    this._io.to(chatId).emit(SocketEvent.MessageRead, { chatId, userId });
                }
                else {
                    console.log(`No messages were marked as read for chatId: ${chatId}`);
                }
            }
            catch (error) {
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
        }));
        socket.on(SocketEvent.OutgoingVideoCall, (data) => __awaiter(this, void 0, void 0, function* () {
            console.log("Received outgoing-video-call:", JSON.stringify(data, null, 2));
            const { to, from, tutorName, tutorImage, studentName, studentImage, callType, roomId } = data;
            const missingFields = [];
            if (!to)
                missingFields.push("to");
            if (!from)
                missingFields.push("from");
            if (!roomId)
                missingFields.push("roomId");
            if (!callType)
                missingFields.push("callType");
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
                console.log(`Emitting incoming-video-call to student ${to} (socket: ${studentSocketId}):`, JSON.stringify(videoCallPayload, null, 2));
                this._io.to(studentSocketId).emit(SocketEvent.IncomingVideoCall, videoCallPayload);
            }
            catch (error) {
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
        }));
        socket.on(SocketEvent.AcceptIncomingCall, (data) => __awaiter(this, void 0, void 0, function* () {
            console.log("Received accept-incoming-call:", JSON.stringify(data, null, 2));
            const { to, from, roomId } = data;
            const missingFields = [];
            if (!to)
                missingFields.push("to");
            if (!from)
                missingFields.push("from");
            if (!roomId)
                missingFields.push("roomId");
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
                const message = yield this.chatService.saveMessage(roomId, from, "Video call initiated", new Date(), "video-call");
                if (message) {
                    console.log(`Emitting new-message for video call to room ${roomId}:`, JSON.stringify(message, null, 2));
                    this._io.to(roomId).emit(SocketEvent.NewMessage, message);
                }
            }
            catch (error) {
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
        }));
        socket.on(SocketEvent.RejectCall, (data) => __awaiter(this, void 0, void 0, function* () {
            console.log("Received reject-call:", JSON.stringify(data, null, 2));
            const { to, sender, name, from } = data;
            if (!to || !sender) {
                console.error(`Invalid reject call data. Missing: ${!to ? "to" : ""} ${!sender ? "sender" : ""}`, { data, userId, socketId: socket.id });
                socket.emit("error", { message: "Invalid call data" });
                return;
            }
            try {
                let targetSocketId;
                if (sender === "student" || sender === "user") {
                    targetSocketId = this._tutorSocketMap.get(to);
                    console.log(`Student rejected call, notifying tutor ${to}`);
                }
                else if (sender === "tutor") {
                    targetSocketId = this._userSocketMap.get(to);
                    console.log(`Tutor rejected call, notifying student ${to}`);
                }
                else {
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
                socket.emit(SocketEvent.RejectCall, Object.assign(Object.assign({}, rejectionPayload), { message: "Call ended successfully" }));
            }
            catch (error) {
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
        }));
        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${userId} with socket ID: ${socket.id}`);
            this.removeSocket(userId, role);
            this.emitOnlineUsers();
        });
    }
    removeSocket(userId, role) {
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
    emitToAdmins(event, data) {
        for (const [_, socketId] of this._adminSocketMap) {
            this._io.to(socketId).emit(event, data);
        }
    }
    getOnlineUsersCount() {
        return {
            users: this._userSocketMap.size,
            tutors: this._tutorSocketMap.size,
            admins: this._adminSocketMap.size,
        };
    }
    isUserOnline(userId, role) {
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
