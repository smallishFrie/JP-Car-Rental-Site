import "server-only";

import { readOptionalServerEnv, readServerEnv } from "@/lib/env";

export async function sendBookingSms(input: { to: string; message: string }) {
  const provider = readOptionalServerEnv("SMS_PROVIDER").toLowerCase();

  if (provider === "semaphore") {
    const apiKey = readServerEnv("SEMAPHORE_API_KEY");
    const senderName = readOptionalServerEnv("SEMAPHORE_SENDER_NAME") || "JPRENTAL";
    const response = await fetch("https://api.semaphore.co/api/v4/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: apiKey,
        number: input.to,
        message: input.message,
        sendername: senderName,
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to send SMS via Semaphore.");
    }
    return;
  }

  if (provider === "twilio") {
    const accountSid = readServerEnv("TWILIO_ACCOUNT_SID");
    const authToken = readServerEnv("TWILIO_AUTH_TOKEN");
    const fromNumber = readServerEnv("TWILIO_FROM_NUMBER");
    const body = new URLSearchParams({
      To: input.to,
      From: fromNumber,
      Body: input.message,
    });
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!response.ok) {
      throw new Error("Failed to send SMS via Twilio.");
    }
  }
}
