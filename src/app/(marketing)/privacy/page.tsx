import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What QRForge collects, why, how long it's kept, and what visitors and QR code owners can expect.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "2026-08-23";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated {LAST_UPDATED}</p>
      </div>

      <div className="mt-6">
        <Alert variant="info">
          This page describes what the product actually does today, as accurately as we can state
          it. It is a draft prepared during implementation and has not yet been reviewed or approved
          by legal counsel or the product owner — treat it as a technical description, not a final
          legal document, until that review happens.
        </Alert>
      </div>

      <div className="mt-10 flex flex-col gap-8 text-sm text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:text-muted-foreground [&_li]:text-muted-foreground">
        <section>
          <h2>Information we collect</h2>
          <p className="mt-2">
            <strong className="text-foreground">Account information.</strong> When you sign up, we
            store your email address and authentication credentials through Supabase Auth, our
            authentication provider. We don&apos;t ask for your name, address, or payment details to
            create an account.
          </p>
          <p className="mt-2">
            <strong className="text-foreground">QR code content.</strong> Whatever you enter to
            create a QR code — a URL, contact details, a Wi-Fi password, a message — is stored so we
            can generate and, for dynamic QR codes, serve that content. If you choose to include
            personal information in a QR code&apos;s content (a vCard, an email address),
            that&apos;s your choice; we store it because you put it there, not because we
            independently collect it.
          </p>
          <p className="mt-2">
            <strong className="text-foreground">Uploaded files.</strong> PDF, image, and audio files
            you upload for file-based QR types are stored in our file storage provider (Supabase
            Storage) and served through your dynamic QR code&apos;s hosted page.
          </p>
          <p className="mt-2">
            <strong className="text-foreground">Feedback submissions.</strong> If you own a Feedback
            QR code, we store the ratings and comments visitors submit through it. A visitor sees a
            consent notice and must opt in before submitting; only you, the QR code&apos;s owner,
            can read what&apos;s submitted, and a submission can&apos;t be edited or deleted through
            the app once made.
          </p>
          <p className="mt-2">
            <strong className="text-foreground">Scan analytics.</strong> For a dynamic QR code, each
            scan records a timestamp, referrer, device type, operating system, and browser (parsed
            from standard technical headers sent by the scanning device), plus a country when our
            hosting platform provides one. We do not store a visitor&apos;s raw IP address, precise
            location, or any identifier that would let us recognize the same visitor across multiple
            scans.
          </p>
        </section>

        <section>
          <h2>Cookies</h2>
          <p className="mt-2">
            We use one type of cookie: a session cookie set by Supabase Auth to keep you signed in.
            It&apos;s strictly necessary for the account and dashboard features to work and
            isn&apos;t used for advertising or cross-site tracking. We don&apos;t use third-party
            analytics or advertising cookies.
          </p>
        </section>

        <section>
          <h2>How we use this information</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
            <li>To create, host, and serve the QR codes and landing pages you build.</li>
            <li>To keep you signed in and let you manage your own QR codes and files.</li>
            <li>To show you scan analytics for your own dynamic QR codes.</li>
            <li>To enforce rate limits and abuse protections on public-facing endpoints.</li>
          </ul>
          <p className="mt-2">
            We don&apos;t sell your information, and we don&apos;t share it with third parties for
            their own advertising or marketing purposes.
          </p>
        </section>

        <section>
          <h2>Who else processes this data</h2>
          <p className="mt-2">
            We use Supabase for authentication, database storage, and file storage. Supabase
            processes data on our behalf, under its own security and privacy practices, and
            doesn&apos;t use it for its own purposes. We don&apos;t currently use any third-party
            analytics or advertising service.
          </p>
        </section>

        <section>
          <h2>Data retention and deletion</h2>
          <p className="mt-2">
            Your QR codes, folders, and uploaded files are kept until you delete them. Deleting a QR
            code also deletes its scan history, feedback submissions, and any uploaded files tied to
            it. Deleting your account deletes your QR codes, folders, and account records along with
            it.
          </p>
          <p className="mt-2">
            A self-service account-deletion control isn&apos;t built into the dashboard yet. Until
            it is, account deletion can be requested directly — a dedicated contact method for
            privacy and data requests will be published here before this policy goes through legal
            review.
          </p>
        </section>

        <section>
          <h2>Your choices</h2>
          <p className="mt-2">
            You can view, edit, pause, or permanently delete any QR code you&apos;ve created at any
            time from your dashboard. You control what content goes into a QR code, and you can stop
            a dynamic QR code from resolving at all by pausing or deleting it.
          </p>
        </section>

        <section>
          <h2>Children&apos;s privacy</h2>
          <p className="mt-2">
            This service isn&apos;t directed at children, and we don&apos;t knowingly collect
            information from children. This section, like the rest of this page, is pending a full
            legal review appropriate to the jurisdictions we operate in.
          </p>
        </section>

        <section>
          <h2>Changes to this policy</h2>
          <p className="mt-2">
            We&apos;ll update the &quot;last updated&quot; date above when this policy changes.
            Material changes will be reflected here before they take effect.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p className="mt-2">
            A dedicated contact address for privacy questions and data requests will be added here.
          </p>
        </section>
      </div>
    </div>
  );
}
