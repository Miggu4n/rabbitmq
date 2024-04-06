import fs from "fs";

import nodemailer from "nodemailer";

const {
  EMAIL_CLIENT_HOST,
  EMAIL_CLIENT_PORT,
  EMAIL_CLIENT_USER,
  EMAIL_CLIENT_PASSWORD,
} = process.env;

export const transporter = nodemailer.createTransport({
  textEncoding: "base64",
  encoding: "base64",
  host: EMAIL_CLIENT_HOST,
  port: Number(EMAIL_CLIENT_PORT),
  auth: {
    user: EMAIL_CLIENT_USER,
    pass: EMAIL_CLIENT_PASSWORD,
  },
});

export enum Templates {
  ORDER_CREATED = "order-created",
  UNREAD_CHATS = "unread-chats",
  INVALID_COMPANIES = "invalid-companies",
  ONBOARDING = "onboarding",
}

export function sendEmail(data: { email?: string } & Record<string, any>) {
  const { SENDER_EMAIL } = process.env;

  const html = "<h1>Ciao</h1>";

  return transporter.sendMail({
    from: SENDER_EMAIL,
    to: data.email || SENDER_EMAIL,
    subject: data.subject || `Deeealer.com`,
    html,
    replyTo: SENDER_EMAIL,
  });
}
