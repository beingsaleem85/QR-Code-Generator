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
import { PdfForm } from "@/components/qr/content-forms/PdfForm";
import { ImagesForm } from "@/components/qr/content-forms/ImagesForm";
import { AudioForm } from "@/components/qr/content-forms/AudioForm";
import { VideoForm } from "@/components/qr/content-forms/VideoForm";
import { AppForm } from "@/components/qr/content-forms/AppForm";
import { SocialForm } from "@/components/qr/content-forms/SocialForm";
import { MultiLinkForm } from "@/components/qr/content-forms/MultiLinkForm";
import { MenuForm } from "@/components/qr/content-forms/MenuForm";
import { FeedbackForm } from "@/components/qr/content-forms/FeedbackForm";

export interface ContentFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

/**
 * Maps a QRType to its content form — only types with a real Zod schema in
 * the registry have an entry. The rest (`barcode_2d`, `location`) fall back
 * to a "coming soon" note in QRContentPanel.
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
  pdf: PdfForm,
  images: ImagesForm,
  audio: AudioForm,
  video: VideoForm,
  app: AppForm,
  social: SocialForm,
  multi_link: MultiLinkForm,
  menu: MenuForm,
  feedback: FeedbackForm,
};
