import "server-only";

import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  CONTACT_TYPES,
  CONTACT_TYPE_LABELS,
  type ContactOptionAdminRow,
  type ContactOptionPublic,
  type ContactType,
} from "@/lib/contact-options-types";

export type { ContactType, ContactOptionAdminRow, ContactOptionPublic } from "@/lib/contact-options-types";
export { CONTACT_TYPES, CONTACT_TYPE_LABELS } from "@/lib/contact-options-types";

const DEFAULT_PHONE_REGION = "PH" as const;

function isContactType(value: string): value is ContactType {
  return (CONTACT_TYPES as readonly string[]).includes(value);
}

const URL_LIKE = /^(https?:\/\/|www\.)/i;

function normalizeHttpsUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  let candidate = trimmed;
  if (/^www\./i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }
    if (url.protocol === "http:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function isPlausibleEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

/** Digits only for WhatsApp wa.me */
function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

/**
 * Build a safe href for a contact row. Returns null when the value should be shown as plain text only.
 */
export function resolveContactHref(
  contactType: ContactType,
  value: string,
): { href: string | null; isExternal: boolean } {
  const v = value.trim();
  if (!v) {
    return { href: null, isExternal: false };
  }

  switch (contactType) {
    case "email": {
      if (!isPlausibleEmail(v)) {
        return { href: null, isExternal: false };
      }
      return { href: `mailto:${v}`, isExternal: false };
    }
    case "phone": {
      try {
        const parsed = parsePhoneNumber(v, DEFAULT_PHONE_REGION);
        if (parsed && isValidPhoneNumber(v, DEFAULT_PHONE_REGION)) {
          return { href: `tel:${parsed.format("E.164")}`, isExternal: false };
        }
      } catch {
        // fall through
      }
      if (onlyDigits(v).length >= 8) {
        return { href: `tel:${onlyDigits(v)}`, isExternal: false };
      }
      return { href: null, isExternal: false };
    }
    case "sms": {
      try {
        const parsed = parsePhoneNumber(v, DEFAULT_PHONE_REGION);
        if (parsed && isValidPhoneNumber(v, DEFAULT_PHONE_REGION)) {
          return { href: `sms:${parsed.format("E.164")}`, isExternal: false };
        }
      } catch {
        // fall through
      }
      const digits = onlyDigits(v);
      if (digits.length >= 8) {
        return { href: `sms:${digits}`, isExternal: false };
      }
      return { href: null, isExternal: false };
    }
    case "whatsapp": {
      const digits = onlyDigits(v);
      if (digits.length < 8 || digits.length > 15) {
        return { href: null, isExternal: false };
      }
      return { href: `https://wa.me/${digits}`, isExternal: true };
    }
    case "website":
    case "facebook":
    case "instagram":
    case "telegram": {
      const url = normalizeHttpsUrl(v);
      if (!url || url.protocol !== "https:") {
        return { href: null, isExternal: false };
      }
      return { href: url.toString(), isExternal: true };
    }
    case "other": {
      if (URL_LIKE.test(v)) {
        const url = normalizeHttpsUrl(v);
        if (url) {
          return {
            href: url.toString(),
            isExternal: url.protocol === "https:" || url.hostname === "localhost",
          };
        }
        return { href: null, isExternal: false };
      }
      try {
        const parsed = parsePhoneNumber(v, DEFAULT_PHONE_REGION);
        if (parsed && isValidPhoneNumber(v, DEFAULT_PHONE_REGION)) {
          return { href: `tel:${parsed.format("E.164")}`, isExternal: false };
        }
      } catch {
        // ignore
      }
      const digits = onlyDigits(v);
      if (digits.length >= 8) {
        return { href: `tel:${digits}`, isExternal: false };
      }
      return { href: null, isExternal: false };
    }
    default: {
      return { href: null, isExternal: false };
    }
  }
}

function toPublicDto(record: ContactOptionAdminRow): ContactOptionPublic {
  const { href, isExternal } = resolveContactHref(record.contact_type, record.value);
  const detail = record.value.trim();
  const title = record.label?.trim() || CONTACT_TYPE_LABELS[record.contact_type];

  return {
    id: record.id,
    contactType: record.contact_type,
    title,
    detail,
    href,
    isExternal,
  };
}

function rowToRecord(row: Record<string, unknown>): ContactOptionAdminRow {
  const typeRaw = String(row.contact_type ?? "");
  if (!isContactType(typeRaw)) {
    throw new Error("Invalid contact_type in database row.");
  }
  return {
    id: String(row.id),
    contact_type: typeRaw,
    label: row.label == null || String(row.label).trim() === "" ? null : String(row.label).trim(),
    value: String(row.value ?? ""),
    sort_order: Number(row.sort_order) || 0,
    is_active: Boolean(row.is_active),
  };
}

export async function listContactOptionsPublic(): Promise<ContactOptionPublic[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_options")
    .select("id, contact_type, label, value, sort_order, is_active")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true, nullsFirst: false });

  if (error) {
    return [];
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  return rows.map((row) => toPublicDto(rowToRecord(row)));
}

export async function listContactOptionsForAdmin(): Promise<ContactOptionAdminRow[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_options")
    .select("id, contact_type, label, value, sort_order, is_active")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  return rows.map(rowToRecord);
}

function validateValueForType(contactType: ContactType, value: string): void {
  const v = value.trim();
  if (!v) {
    throw new Error("Value is required.");
  }

  switch (contactType) {
    case "email": {
      if (!isPlausibleEmail(v)) {
        throw new Error("Enter a valid email address.");
      }
      return;
    }
    case "whatsapp": {
      const d = onlyDigits(v);
      if (d.length < 8 || d.length > 15) {
        throw new Error("WhatsApp needs a phone number (8–15 digits, country code recommended).");
      }
      return;
    }
    case "phone":
    case "sms": {
      if (isValidPhoneNumber(v, DEFAULT_PHONE_REGION)) {
        return;
      }
      if (onlyDigits(v).length >= 8) {
        return;
      }
      throw new Error("Enter a valid phone number.");
    }
    case "website":
    case "facebook":
    case "instagram":
    case "telegram": {
      const url = normalizeHttpsUrl(v);
      if (!url || url.protocol !== "https:") {
        throw new Error("Enter a valid https:// URL.");
      }
      return;
    }
    case "other":
    default:
      return;
  }
}

export async function saveContactOption(input: {
  id?: string;
  contactType: ContactType;
  label: string | null;
  value: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<ContactOptionAdminRow> {
  validateValueForType(input.contactType, input.value);

  const supabase = await createClient();
  const label = input.label?.trim() ? input.label.trim() : null;
  const value = input.value.trim();
  const sortOrder = Number.isFinite(input.sortOrder) ? Math.trunc(input.sortOrder) : 0;
  const payload = {
    contact_type: input.contactType,
    label,
    value,
    sort_order: sortOrder,
    is_active: input.isActive,
  };

  const locationId = input.id?.trim();
  const { data, error } = locationId
    ? await supabase.from("contact_options").update(payload).eq("id", locationId).select("*").single()
    : await supabase.from("contact_options").insert(payload).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save contact option.");
  }
  return rowToRecord(data as Record<string, unknown>);
}

export async function deleteContactOption(id: string) {
  const supabase = await createClient();
  const trimmedId = id.trim();
  if (!trimmedId) {
    throw new Error("Contact id is required.");
  }

  const { error } = await supabase.from("contact_options").delete().eq("id", trimmedId);
  if (error) {
    throw new Error(error.message);
  }
}
