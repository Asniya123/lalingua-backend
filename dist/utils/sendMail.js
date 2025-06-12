var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import nodemailer from "nodemailer";
export function sendMail(email, message) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: "asniya737@gmail.com",
                    pass: "deub zhqm qfbn uord",
                },
            });
            const mailOptions = {
                from: "asniya737@gmail.com",
                to: email,
                subject: "Important Notification",
                text: message,
            };
            yield transporter.sendMail(mailOptions);
            console.log(`Email sent to ${email}`);
            return true;
        }
        catch (error) {
            console.error("Error sending email:", error);
            return false;
        }
    });
}
