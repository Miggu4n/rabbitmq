import "dotenv/config";
import Fastify from "fastify";

import { rabbitMQIstance } from "../amqp";
import { createBirthday } from "./handlers/create-birthday";

const {
  AMQP_RPC_EXCHANGE = "",
  AMQP_EXCHANGE = "",
  AMQP_RPC_API_QUEUE = "",
} = process.env;

async function initializeAmqp() {
  await rabbitMQIstance.connect();
  await rabbitMQIstance.channel!.assertExchange(AMQP_EXCHANGE, "fanout", {
    durable: true,
  });
  await rabbitMQIstance.channel!.assertExchange(AMQP_RPC_EXCHANGE, "fanout", {
    durable: true,
  });

  await rabbitMQIstance.channel!.assertQueue(AMQP_RPC_API_QUEUE, {
    durable: true,
  });

  await rabbitMQIstance.channel!.bindQueue(
    AMQP_RPC_API_QUEUE,
    AMQP_RPC_EXCHANGE,
    "",
    {
      durable: true,
    }
  );
}

async function listenHttp() {
  const app = Fastify({
    logger: false,
  });

  app.post("/birthday", createBirthday);
  await app.listen({ port: 3000 });
}

async function closeServer() {
  await rabbitMQIstance.closeConnection();
  process.exit(1);
}

async function main() {
  try {
    await initializeAmqp();
    await listenHttp();
  } catch (err) {
    await closeServer();
  }
}

main();
