import { Redis } from "@upstash/redis";
import { Server } from "socket.io";
import { Queue } from "bullmq";

// Initialize Redis for Upstash
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});
console.log("Redis URL:", process.env.UPSTASH_REDIS_URL);

const redisUrl = new URL(process.env.UPSTASH_REDIS_URL!);

const redisOptions = {
  connection: {
    host: redisUrl.hostname, // Extracts the host from URL
    port: Number(redisUrl.port) || 6379, // Extracts the port (default to 6379)
    password: process.env.UPSTASH_REDIS_TOKEN!,
    tls: {}, // Required for Upstash since it uses rediss://
  },
};

// Initialize BullMQ Queue
const emailQueue = new Queue("email_notifications", redisOptions);

// Poll for new messages manually since Upstash does not support callbacks
async function pollNotifications(io: Server) {
    console.log("🔄 Starting Redis notification polling...");
  
    while (true) {
      try {
        const messages = await redis.lrange("new_notifications", 0, -1);
  
        if (messages.length > 0) {
          console.log(`📬 Found ${messages.length} new notifications in Redis.`);
  
          for (const message of messages) {
            try {
              const notification = JSON.parse(message);
              
              console.log("📢 Sending notification:", notification);
  
              // Emit notification to the specific user via WebSocket
              io.to(notification.userId).emit("new_notification", notification);
              console.log(`✅ Sent notification to user in redis: ${notification.userId}`);
            } catch (error) {
              console.error("❌ Error parsing notification message:", error);
            }
          }
  
          // Remove processed messages from Redis
          await redis.del("new_notifications");
          console.log("🗑️ Cleared processed notifications from Redis.");
        }
      } catch (error) {
        console.error("❌ Redis polling error:", error);
      }
      
      // Poll every 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

export { redis, redisOptions, emailQueue, pollNotifications };
