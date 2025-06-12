import { Server as SocketIOServer } from "socket.io";
import SocketController from "./controllers/Socket/socketController.js";
import chatService from "./service/UseCase/chatService.js";
const Ioconfig = (server) => {
    const io = new SocketIOServer(server, {
        cors: {
            origin: 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    const socketController = new SocketController(chatService, io);
    io.on("connection", (socket) => {
        socketController.onConnection(socket);
    });
    return io;
};
export default Ioconfig;
