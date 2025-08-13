import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors, { CorsOptions } from 'cors';
import mongoConnect from './config/db'
import studentRoute from './routes/student/studentRoute'
import chatRoute from './routes/student/chatRoute'
import tutorRoutes from './routes/tutor/tutorRoute';
import tutorChatRoute from './routes/tutor/tutorChatRoute'
import adminRoutes from './routes/admin/adminRoute';
import { createServer } from 'http';
import Ioconfig from './socket.config';
import { Server } from 'https';

dotenv.config();



const app: Application = express();
const server = createServer(app)

const corsOptions: CorsOptions = {
  origin: 'http://localhost:5173',
  methods: 'GET,PUT,PATCH,POST,DELETE',
  credentials: true,
};
app.use(cors(corsOptions));

const port: string | number = process.env.PORT || 5000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoConnect();

app.use('/api/user', studentRoute,chatRoute);
app.use('/api/tutor', tutorRoutes, tutorChatRoute);
app.use('/api/admin', adminRoutes);



Ioconfig(server)

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});  
      

