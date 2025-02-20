import { Schema, model } from "mongoose";
import { IAdmin } from '../interface/IAdmin.js';

const AdminSchema = new Schema<IAdmin>({
    name: {
        type: String,  
        required: true, 
    },
    email: {
        type: String,  
        required: true, 
        unique: true,   
    },
    password: {
        type: String,  
        required: true, 
    },
 
});

const adminModel = model<IAdmin>('Admin', AdminSchema);
export default adminModel;
