import "dotenv/config";

import { rabbitMQIstance } from "../amqp";
import { sendEmail } from "./mail";
import { parseMessage } from "../utils";

const {
  AMQP_EXCHANGE = "",
  AMQP_DB_QUEUE = "",
  AMQP_MAIL_QUEUE = "",
} = process.env;

type Birthday = {
  name: string;
  email: string;
  date: Date;
};

type CreateBirthdayAction = {
  type: "create" | "birthday";
  data: Birthday;
};

async function sendOnboardEmail(email: string) {
  await sendEmail({ email });
}

async function sendBirthdayEmail(email: string): Promise<boolean> {
  console.log(email);
  return true;
}

async function initializeAmqp() {
  const assertingOption = {
    durable: true,
  };

  await rabbitMQIstance.connect();
  await rabbitMQIstance.channel!.assertExchange(
    AMQP_EXCHANGE,
    "",
    assertingOption
  );
  await rabbitMQIstance.channel!.assertQueue(AMQP_DB_QUEUE, { durable: true });
  await rabbitMQIstance.channel!.bindQueue(AMQP_DB_QUEUE, AMQP_EXCHANGE, "");
}

async function consumeMessages() {
  return await rabbitMQIstance.channel?.consume("mail", async (msg) => {
    if (!msg) return;
    const message = msg.content.toString();
    const action = parseMessage<CreateBirthdayAction>(message!);

    if (!action) return;

    switch (action.type) {
      case "birthday":
        await sendBirthdayEmail(action.data.email);
        break;
      case "create":
        await sendOnboardEmail(action.data.email);
        break;
    }

    rabbitMQIstance.channel?.ack(msg);
  });
}

async function main() {
  try {
    await initializeAmqp();
    await consumeMessages();
  } catch (e: any) {
    throw new Error(e);
  }
}

main();
