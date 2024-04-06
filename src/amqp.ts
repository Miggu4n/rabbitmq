import amqplib from "amqplib";
const { AMQP_CONNECTION_STRING = "" } = process.env;

class RabbitMQ {
  connection?: amqplib.Connection;
  channel?: amqplib.Channel;

  async connect(): Promise<void> {
    try {
      this.connection = await amqplib.connect(AMQP_CONNECTION_STRING);
      this.channel = await this.connection.createChannel();
    } catch (e: any) {
      throw new Error(e);
    }
  }

  async closeConnection(): Promise<void> {
    await this.connection?.close();
  }
}

export const rabbitMQIstance = new RabbitMQ();
