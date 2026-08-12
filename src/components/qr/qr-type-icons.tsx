import {
  Calendar,
  Contact,
  FileText,
  Images,
  Layers,
  Link,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Music,
  Phone,
  ScanLine,
  Share2,
  Smartphone,
  Star,
  Type,
  Utensils,
  Video,
  Wifi,
  type LucideIcon,
} from "lucide-react";

/**
 * Resolves a QRTypeDefinition.icon key (Module 1.3 — a plain string so the
 * domain layer stays UI-agnostic) to an actual icon component. Add an entry
 * here whenever a new icon key is introduced in the registry.
 */
export const QR_TYPE_ICONS: Record<string, LucideIcon> = {
  link: Link,
  type: Type,
  mail: Mail,
  phone: Phone,
  "message-square": MessageSquare,
  contact: Contact,
  "message-circle": MessageCircle,
  wifi: Wifi,
  "file-text": FileText,
  smartphone: Smartphone,
  images: Images,
  video: Video,
  "share-2": Share2,
  calendar: Calendar,
  "scan-line": ScanLine,
  layers: Layers,
  utensils: Utensils,
  star: Star,
  music: Music,
  "map-pin": MapPin,
};
