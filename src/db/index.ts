import "dotenv/config";
import { db } from "./db";

import { rabbitMQIstance } from "../amqp";
import { formatMessage, parseMessage } from "../utils";

const {
  AMQP_DB_QUEUE = "",
  AMQP_RPC_QUEUE = "",
  AMQP_EXCHANGE = "",
  AMQP_RPC_EXCHANGE = "",
} = process.env;

type RPCMessage = {
  status: number;
};

type Birthday = {
  name: string;
  date: Date;
  email: string;
};

type CreateBirthdayAction = {
  type: "create";
  data: Birthday;
};

async function initializeAmqp() {
  await rabbitMQIstance.connect();

  await rabbitMQIstance.channel!.assertQueue(AMQP_DB_QUEUE, { durable: true });
  await rabbitMQIstance.channel!.bindQueue(AMQP_DB_QUEUE, AMQP_EXCHANGE, "");

  await rabbitMQIstance.channel!.assertQueue(AMQP_RPC_QUEUE, { durable: true });
  await rabbitMQIstance.channel!.bindQueue(AMQP_RPC_QUEUE, AMQP_EXCHANGE, "");
}

function createBirthday(birthday: Birthday) {
  return db.birthdays.insertOne({
    ...birthday,
    date: new Date(birthday.date),
  });
}

async function consumeMessages() {
  return rabbitMQIstance.channel!.consume(AMQP_DB_QUEUE, async (message) => {
    if (!message) return;

    const action = parseMessage<CreateBirthdayAction>(
      message.content.toString()
    );

    if (!action) return;

    try {
      if (action.type !== "create") return;
      await createBirthday(action.data);
      rabbitMQIstance.channel!.ack(message);
      const reply = formatMessage<RPCMessage>({
        status: 201,
      });
      rabbitMQIstance.channel!.publish(AMQP_RPC_EXCHANGE, "", reply, {
        correlationId: message.properties.correlationId,
      });
    } catch (e: any) {
      const reply = formatMessage<RPCMessage>({
        status: 500,
      });
      rabbitMQIstance.channel!.publish(AMQP_RPC_EXCHANGE, "", reply, {
        correlationId: message.properties.correlationId,
      });
    }
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
