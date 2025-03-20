import { Worker } from "bullmq";
import * as nodemailer from "nodemailer";
import { redisOptions } from "../config/redis";


const transporter = nodemailer.createTransport({
  service: "SendGrid",
  auth: {
    user: process.env.SENDGRID_USER,
    pass: process.env.SENDGRID_PASS,
  },
});

// Create Worker for Processing Email Jobs
const emailWorker = new Worker(
  "email_notifications",
  async (job) => {
    const { email, subject, message } = job.data;

    try {
      await transporter.sendMail({
        from: "no-reply@yourapp.com",
        to: email,
        subject,
        text: message,
      });

      console.log("✅ Email sent:", email);
    } catch (error) {
      console.error("❌ Failed to send email:", error);
    }
  },
  redisOptions
);

console.log("📨 Email Worker Started!");
