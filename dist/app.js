import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoConnect from './config/db.js';
import studentRoute from './routes/student/studentRoute.js';
import chatRoute from './routes/student/chatRoute.js';
import tutorRoutes from './routes/tutor/tutorRoute.js';
import tutorChatRoute from './routes/tutor/tutorChatRoute.js';
import adminRoutes from './routes/admin/adminRoute.js';
import { createServer } from 'http';
import Ioconfig from './socket.config.js';
dotenv.config();
const app = express();
const server = createServer(app);
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
};
app.use(cors(corsOptions));
const port = 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
mongoConnect();
app.use('/api/user', studentRoute, chatRoute);
app.use('/api/tutor', tutorRoutes, tutorChatRoute);
app.use('/api/admin', adminRoutes);
Ioconfig(server);
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
