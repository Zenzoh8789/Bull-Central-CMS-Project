import nodemailer from "nodemailer";
import { EnquiryDto } from "./dto/create-enquiry.dto";

export const ENQUIRY_RECIPIENT = "media@bullmachine.com";

export function enquiryEmail(reference: string, dealer: { name: string; location?: string }, enquiry: EnquiryDto, sender: string) {
  return {
    from: { name: "BULL Website", address: sender },
    to: ENQUIRY_RECIPIENT,
    replyTo: enquiry.email ? { name: enquiry.name, address: enquiry.email } : undefined,
    subject: `BULL website enquiry — ${reference}`,
    text: [
      "New website enquiry", "", `Reference: ${reference}`,
      `Dealer: ${dealer.name}`, `Dealer location: ${dealer.location || ""}`,
      `Received (UTC): ${new Date().toISOString()}`, "",
      `Name: ${enquiry.name}`, `Phone: ${enquiry.phone}`,
      `Email: ${enquiry.email || "Not provided"}`,
      `Address: ${enquiry.address || "Not provided"}`,
      `District / State: ${enquiry.district || "Not provided"}`,
      `Equipment: ${enquiry.product}`, `Consent: ${enquiry.consent ? "Yes" : "No"}`,
      "", "Message:", enquiry.message,
    ].join("\n"),
    disableFileAccess: true,
    disableUrlAccess: true,
  };
}

export async function sendEnquiryEmail(reference: string, dealer: { name: string; location?: string }, enquiry: EnquiryDto) {
  const host = process.env.SMTP_HOST?.trim();
  const sender = process.env.SMTP_FROM?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || (process.env.SMTP_SECURE === undefined && port === 465);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  if (!host || !sender || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(sender) ||
      !Number.isInteger(port) || port < 1 || port > 65535 || Boolean(user) !== Boolean(password)) {
    throw Object.assign(new Error("Configure SMTP_HOST, SMTP_PORT, SMTP_FROM and SMTP authentication in the root .env"), { code: "SMTP_NOT_CONFIGURED" });
  }
  const transport = nodemailer.createTransport({
    host, port, secure,
    requireTLS: !secure,
    auth: user && password ? { user, pass: password } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    logger: false,
    debug: false,
  });
  const result = await transport.sendMail(enquiryEmail(reference, dealer, enquiry, sender));
  if (!result.accepted?.some((address: string | { address: string }) =>
    (typeof address === "string" ? address : address.address).toLowerCase() === ENQUIRY_RECIPIENT)) {
    throw Object.assign(new Error("The mail server did not accept the enquiry recipient"), { code: "SMTP_RECIPIENT_REJECTED" });
  }
}
