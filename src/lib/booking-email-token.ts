import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { readOptionalServerEnv } from "@/lib/env";

const TOKEN_VERSION = 1;
const DEFAULT_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function getSecret() {
  return readOptionalServerEnv("BOOKING_EMAIL_ACTION_SECRET").trim();
}

export function canSignBookingEmailActions() {
  return getSecret().length >= 16;
}

export function signBookingEmailActionToken(bookingId: string, ttlMs = DEFAULT_TTL_MS) {
  const secret = getSecret();
  if (secret.length < 16) {
    throw new Error("BOOKING_EMAIL_ACTION_SECRET is not set (min 16 chars).");
  }
  const exp = Date.now() + ttlMs;
  const payload = Buffer.from(JSON.stringify({ v: TOKEN_VERSION, bid: bookingId, exp }), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyBookingEmailActionToken(token: string): { ok: true; bookingId: string } | { ok: false; reason: string } {
  const secret = getSecret();
  if (secret.length < 16) {
    return { ok: false, reason: "Email actions are not configured." };
  }
  const trimmed = token.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot <= 0) {
    return { ok: false, reason: "Invalid link." };
  }
  const payload = trimmed.slice(0, dot);
  const sig = trimmed.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "Invalid or tampered link." };
  }
  try {
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { v?: number; bid?: string; exp?: number };
    if (json.v !== TOKEN_VERSION || typeof json.bid !== "string" || !json.bid.trim()) {
      return { ok: false, reason: "Invalid link." };
    }
    if (typeof json.exp !== "number" || Date.now() > json.exp) {
      return { ok: false, reason: "This link has expired. Please contact us if you need help." };
    }
    return { ok: true, bookingId: json.bid.trim() };
  } catch {
    return { ok: false, reason: "Invalid link." };
  }
}
