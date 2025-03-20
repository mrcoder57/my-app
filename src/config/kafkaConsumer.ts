import { kafka } from "./kafka";
import { redis } from "./redis";

const consumer = kafka.consumer({ groupId: "websocket-group" });

export async function startKafkaConsumer() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: "notifications.in_app" });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        const notification = JSON.parse(message.value.toString());

        // Store in Redis for caching
        await redis.lpush(
          `notifications:${notification.userId}`,
          JSON.stringify(notification)
        );

        // Publish real-time update
        await redis.publish("new_notification", JSON.stringify(notification));
      },
    });

    console.log("✅ Kafka consumer connected & listening to 'notifications.in_app'");
  } catch (error) {
    console.error("❌ Kafka Consumer Error:", error);
  }
}
