var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Schema, model } from 'mongoose';
import bcrypt from "bcrypt";
const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    mobile: {
        type: Number,
    },
    password: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
    },
    expiresAt: {
        type: Date,
        required: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
        required: true,
    },
    profilePicture: {
        type: String,
        required: false,
    },
    dateOfBirth: {
        type: Date,
        required: false,
    },
    is_blocked: {
        type: Boolean,
        default: false,
    },
    enrollments: [{
            courseId: {
                type: Schema.Types.ObjectId,
                ref: 'Course',
                required: true,
            },
            paymentId: {
                type: String,
                required: true,
            },
            orderId: {
                type: String,
                required: true,
            },
            amount: {
                type: Number,
                required: true,
            },
            currency: {
                type: String,
                default: 'INR',
            },
            status: {
                type: String,
                enum: ['pending', 'completed', 'failed'],
                default: 'completed',
            },
            enrolledAt: {
                type: Date,
                default: Date.now,
            },
        }],
}, {
    timestamps: true,
});
UserSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('password'))
            return next();
        const salt = yield bcrypt.genSalt(10);
        this.password = yield bcrypt.hash(this.password, salt);
        next();
    });
});
UserSchema.methods.comparePassword = function (candidatePassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return bcrypt.compare(candidatePassword, this.password);
    });
};
const userModel = model('Student', UserSchema);
export default userModel;
