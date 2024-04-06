import "dotenv/config";
import Fastify from "fastify";

import cron from "node-cron";
import { getMonth, getDate } from "date-fns";

import { db } from "./db";
import { formatMessage } from "../utils";
import { rabbitMQIstance } from "../amqp";

const app = Fastify({
  logger: true,
});

async function getBirthdays() {
  const today = new Date();
  return await db.birthdays
    .find({
      $expr: {
        $and: [
          { $eq: [{ $month: "$date" }, getMonth(today)] },
          { $eq: [{ $dayOfMonth: "$date" }, getDate(today) - 1] },
        ],
      },
    })
    .toArray();
}

async function birthdayCronJob() {
  const birthdays = await getBirthdays();

  for (const birthday of birthdays) {
    const message = formatMessage(birthday);
    rabbitMQIstance.channel?.publish("birthdays", "", message);
  }
}

async function runServer() {
  try {
    await rabbitMQIstance.connect();
    cron.schedule("*/2 * * * * *", birthdayCronJob);
  } catch (err) {
    rabbitMQIstance.closeConnection();
    process.exit(1);
  }
}

runServer();
