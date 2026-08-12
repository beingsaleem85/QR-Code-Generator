import type { ComponentType } from "react";
import type { QRType } from "@/types/qr";
import { UrlForm } from "@/components/qr/content-forms/UrlForm";
import { TextForm } from "@/components/qr/content-forms/TextForm";
import { EmailForm } from "@/components/qr/content-forms/EmailForm";
import { PhoneForm } from "@/components/qr/content-forms/PhoneForm";
import { SmsForm } from "@/components/qr/content-forms/SmsForm";
import { WhatsAppForm } from "@/components/qr/content-forms/WhatsAppForm";
import { WifiForm } from "@/components/qr/content-forms/WifiForm";
import { VCardForm } from "@/components/qr/content-forms/VCardForm";
import { EventForm } from "@/components/qr/content-forms/EventForm";

export interface ContentFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

/**
 * Maps a QRType to its content form — only the 9 types with a real Zod
 * schema in the Module 1.3 registry have an entry. The rest fall back to
 * a "coming soon" note in QRContentPanel.
 */
export const CONTENT_FORMS: Partial<Record<QRType, ComponentType<ContentFormProps>>> = {
  url: UrlForm,
  text: TextForm,
  email: EmailForm,
  phone: PhoneForm,
  sms: SmsForm,
  whatsapp: WhatsAppForm,
  wifi: WifiForm,
  vcard: VCardForm,
  event: EventForm,
};
