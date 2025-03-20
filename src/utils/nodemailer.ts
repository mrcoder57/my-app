import { kafka } from "../config/kafka";
import { emailQueue } from "../config/redis";


async function startEmailConsumer() {
  const emailConsumer = kafka.consumer({ groupId: "email-group" });

  await emailConsumer.connect();
  await emailConsumer.subscribe({ topic: "notifications.email" });

  console.log("📩 Email Consumer is listening...");

  await emailConsumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      try {
        const emailData = JSON.parse(message.value.toString());
        console.log("📧 Email added to queue:", emailData);

        await emailQueue.add("sendEmail", emailData);
      } catch (error) {
        console.error("❌ Error processing email message:", error);
      }
    },
  });
}

// Start Kafka Consumer
startEmailConsumer().catch((err) => console.error("❌ Kafka Consumer Error:", err));
