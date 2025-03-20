import { Kafka, Producer, RecordMetadata } from "kafkajs";
import * as fs from "fs";
import * as path from "path";
console.log("Resolved CA File Path:", path.resolve(__dirname, "ca.pem"));

const KAFKA_USER = process.env.KAFKA_USER!;
const KAFKA_PASSWORD = process.env.KAFKA_PASSWORD!;

// Ensure environment variables are present
if ( !KAFKA_USER || !KAFKA_PASSWORD) {
  console.error("❌ Missing Kafka environment variables");
  process.exit(1);
}

console.log("Resolved CA File Path:", path.resolve(__dirname, "ca.pem"));
if(!path.resolve(__dirname, "ca.pem")){
    console.error("❌ Missing CA file");
}

const kafka = new Kafka({
  clientId: "websocket-group",
  brokers: ["from ur env "], // Replace with actual Aiven Kafka broker URL
  ssl: {
    ca: [fs.readFileSync(path.resolve(__dirname, "ca.pem"), "utf8")],
  },
  sasl: {
    mechanism: "plain",
    username: KAFKA_USER,
    password: KAFKA_PASSWORD,
  },
});

const producer: Producer = kafka.producer();

async function connectProducer() {
  try {
    await producer.connect();
    console.log("✅ Connected to Kafka!");
  } catch (error) {
    console.error("❌ Error connecting to Kafka:", error);
    process.exit(1);
  }
}

async function sendNotification(event: { userId: string; sendEmail: boolean }) {
    try {
      console.log("📤 Sending event to Kafka:", event);
  
      // Send message with acknowledgment from all in-sync replicas
      const response: RecordMetadata[] = await producer.send({
        topic: "notifications.in_app",
        messages: [{ key: event.userId, value: JSON.stringify(event) }],
        acks: -1, // Wait for all replicas to confirm receipt
      });
  
      console.log("✅ Kafka Response:", response);
  
      if (event.sendEmail) {
        const emailResponse: RecordMetadata[] = await producer.send({
          topic: "notifications.email",
          messages: [{ key: event.userId, value: JSON.stringify(event) }],
          acks: -1,
        });
  
        console.log("📩 Email notification sent:", emailResponse);
      }
  
      console.log("✅ Notification successfully published:", event);
    } catch (error) {
      console.error("❌ Error sending notification to Kafka:", error);
    }
  }
  
  // Ensure the producer is connected at startup
  connectProducer();
export { kafka, sendNotification };
