import nodemailer, { Transporter } from "nodemailer";

export async function sendMail(email: string, message: string): Promise<boolean> {
  try {
    const transporter: Transporter = nodemailer.createTransport({
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

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error("Error sending email:", error);
    return false;
  }
}
