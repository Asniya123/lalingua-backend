import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors, { CorsOptions } from 'cors';
import mongoConnect from './config/db.js'
import studentRoute from './routes/student/studentRoute.js'
import tutorRoutes from './routes/tutor/tutorRoute.js';
import adminRoutes from './routes/admin/adminRoute.js';
import { createServer } from 'http';
import { Server as SocketIOServer  } from 'socket.io';
import Ioconfig from './socket.config.js';
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

const port: string | number =   5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoConnect();

app.use('/api/user', studentRoute);
app.use('/api/tutor', tutorRoutes);
app.use('/api/admin', adminRoutes);



Ioconfig(server)

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});  
      

