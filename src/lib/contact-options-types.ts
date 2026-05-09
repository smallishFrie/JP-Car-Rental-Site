export const CONTACT_TYPES = [
  "email",
  "phone",
  "whatsapp",
  "sms",
  "website",
  "facebook",
  "instagram",
  "telegram",
  "other",
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  email: "Email",
  phone: "Phone",
  whatsapp: "WhatsApp",
  sms: "SMS",
  website: "Website",
  facebook: "Facebook",
  instagram: "Instagram",
  telegram: "Telegram",
  other: "Other",
};

export type ContactOptionAdminRow = {
  id: string;
  contact_type: ContactType;
  label: string | null;
  value: string;
  sort_order: number;
  is_active: boolean;
};

/** Public site — resolved labels and safe links. */
export type ContactOptionPublic = {
  id: string;
  contactType: ContactType;
  title: string;
  detail: string;
  href: string | null;
  isExternal: boolean;
};
