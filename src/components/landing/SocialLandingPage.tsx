import { isSafeRedirectTarget } from "@/lib/qr/redirect-url";
import { Avatar } from "@/components/ui/Avatar";
import { buttonVariants } from "@/components/ui/Button";

interface SocialLandingPageProps {
  payloadData: Record<string, unknown>;
}

interface QrLinkPayload {
  label?: string;
  url?: string;
}

interface SocialIconPayload {
  platform?: string;
  url?: string;
}

/**
 * A handful of self-contained utility classes per theme rather than a
 * full theming system — three presets is what the master prompt actually
 * asks for ("optional theme selection"), not a general-purpose design
 * token layer.
 */
const THEME_CLASSES: Record<string, string> = {
  light: "bg-white text-neutral-900 border-neutral-200",
  dark: "bg-neutral-900 text-neutral-50 border-neutral-700",
  brand: "bg-primary text-primary-foreground border-transparent",
};

export function SocialLandingPage({ payloadData }: SocialLandingPageProps) {
  const title = typeof payloadData.title === "string" ? payloadData.title : "";
  const avatarUrl = typeof payloadData.avatarUrl === "string" ? payloadData.avatarUrl : undefined;
  const description =
    typeof payloadData.description === "string" ? payloadData.description : undefined;
  const theme = typeof payloadData.theme === "string" ? payloadData.theme : "light";
  const links = (Array.isArray(payloadData.links) ? payloadData.links : []) as QrLinkPayload[];
  const icons = (Array.isArray(payloadData.icons) ? payloadData.icons : []) as SocialIconPayload[];

  const safeLinks = links.filter(
    (link): link is { label: string; url: string } =>
      !!link.label && !!link.url && isSafeRedirectTarget(link.url),
  );
  const safeIcons = icons.filter(
    (icon): icon is { platform: string; url: string } =>
      !!icon.platform && !!icon.url && isSafeRedirectTarget(icon.url),
  );

  const themeClass = THEME_CLASSES[theme] ?? THEME_CLASSES.light;

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-6">
      <div
        className={`flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border p-6 shadow-sm ${themeClass}`}
      >
        <Avatar name={title || "Profile"} avatarUrl={avatarUrl} size={64} />
        {title ? <p className="text-lg font-semibold">{title}</p> : null}
        {description ? <p className="text-center text-sm opacity-80">{description}</p> : null}

        {safeIcons.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {safeIcons.map((icon, index) => (
              <a
                key={`${icon.url}-${index}`}
                href={icon.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-current px-3 py-1 text-xs capitalize opacity-90 hover:opacity-100"
              >
                {icon.platform}
              </a>
            ))}
          </div>
        ) : null}

        {safeLinks.length > 0 ? (
          <div className="flex w-full flex-col gap-2">
            {safeLinks.map((link, index) => (
              <a
                key={`${link.url}-${index}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "secondary", className: "w-full" })}
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}

        {safeLinks.length === 0 && safeIcons.length === 0 ? (
          <p className="text-sm opacity-70">This page isn&apos;t available right now.</p>
        ) : null}
      </div>
    </main>
  );
}
