import { Schema, model } from "mongoose";
import { IAdmin } from '../interface/IAdmin';

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
