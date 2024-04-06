import { FastifyReply, FastifyRequest } from "fastify";
import { rabbitMQIstance } from "../../amqp";
import { formatMessage, parseMessage } from "../../utils";
import { randomUUID } from "crypto";

const { AMQP_EXCHANGE = "", AMQP_RPC_API_QUEUE = "" } = process.env;

type CreateBirthdayRequest = {
  Body: { name: string; date: Date; email: string };
};

type User = {
  date: Date;
  name: string;
  email: string;
};

type BirthayMessage = {
  type: "create";
  data: User;
};

type RPCMessage = {
  actionId: string;
  status: number;
};

export const createBirthday = async (
  request: FastifyRequest<CreateBirthdayRequest>,
  reply: FastifyReply
) => {
  try {
    const correlationId = randomUUID();
    const message = formatMessage<BirthayMessage>({
      type: "create",
      data: request.body,
    });

    await rabbitMQIstance.channel!.publish(AMQP_EXCHANGE, "", message, {
      correlationId,
    });

    while (true) {
      const msg = await rabbitMQIstance.channel!.get(AMQP_RPC_API_QUEUE);
      if (!msg || msg.properties.correlationId !== correlationId) continue;
      const action = parseMessage<RPCMessage>(msg.content.toString());
      rabbitMQIstance.channel!.ack(msg);
      if (!action) return reply.status(500).send();
      return reply.status(action?.status).send();
    }
  } catch (e) {
    reply.status(500);
  }
};
