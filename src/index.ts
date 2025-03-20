import { serve } from "bun";
import { Hono } from "hono";
import { Server } from "socket.io";
import { createServer } from "http";
import { startKafkaConsumer } from "./config/kafkaConsumer"; // Kafka Consumer
import { pollNotifications, redis,  } from "./config/redis"; // Redis
import { sendNotification } from "./config/kafka";

const app = new Hono();
app.get("/", (c) => c.text("Hello Hono!"));

const server = createServer(app.fetch as any);

const ioServer = new Server(server, {
  path: "/ws",
  serveClient: false,
  cors: { origin: "*" },
});

// Redis Subscription
pollNotifications(ioServer);
redis

ioServer.on("error", (err) => {
  console.error("Socket.io Error:", err);
});

ioServer.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("new_notification", async (data) => {
    console.log("📩 New notification received from client:", data);

    // Forward notification to Kafka
    try {
      await sendNotification(data);
      console.log("✅ Notification sent to Kafkain kafka logs:", data);
    } catch (error) {
      console.error("❌ Error sending notification to Kafka:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// // Start Kafka Consumer
startKafkaConsumer();

// Emit test messages every second
setInterval(() => {
  ioServer.emit("hello", "world");
}, 1000);

// Start the server
server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
