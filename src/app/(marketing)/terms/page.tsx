import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for creating an account, generating QR codes, and using dynamic QR codes and hosted pages on QRForge.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "2026-08-23";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Terms of Service</h1>
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
          <h2>Acceptance of these terms</h2>
          <p className="mt-2">
            By creating an account or using QRForge, you agree to these terms. If you don&apos;t
            agree, don&apos;t use the service.
          </p>
        </section>

        <section>
          <h2>What the service does</h2>
          <p className="mt-2">
            QRForge lets you generate static and dynamic QR codes, style and export them, and — for
            dynamic QR codes — edit their destination, pause them, and see scan analytics after
            they&apos;re printed. Some QR types host content directly (files, link-in-bio pages,
            menus, feedback forms) on a page we serve.
          </p>
        </section>

        <section>
          <h2>Your account</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
            <li>You&apos;re responsible for keeping your account credentials secure.</li>
            <li>You&apos;re responsible for the accuracy of the email address you sign up with.</li>
            <li>You&apos;re responsible for everything created or uploaded under your account.</li>
          </ul>
        </section>

        <section>
          <h2>Acceptable use</h2>
          <p className="mt-2">You agree not to use QRForge to:</p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
            <li>
              Create a QR code, upload a file, or host a page containing illegal content, malware,
              phishing links, or content that infringes someone else&apos;s rights.
            </li>
            <li>
              Attempt to bypass rate limits, abuse public endpoints, or interfere with the
              service&apos;s availability for other users.
            </li>
            <li>Impersonate another person or organization without authorization.</li>
          </ul>
          <p className="mt-2">
            We may suspend or remove content, or suspend or terminate an account, for a violation of
            these terms.
          </p>
        </section>

        <section>
          <h2>Your content</h2>
          <p className="mt-2">
            You own the content you put into a QR code and any files you upload. By creating a QR
            code or uploading a file, you give us the limited right to store it and serve it back —
            through your QR code&apos;s redirect or hosted page — for as long as that QR code
            exists. We don&apos;t claim ownership of your content and don&apos;t use it for anything
            beyond operating the service for you.
          </p>
        </section>

        <section>
          <h2>Dynamic QR codes</h2>
          <p className="mt-2">
            A dynamic QR code&apos;s printed image encodes a stable link we host, not your
            destination directly — its whole purpose is that you can change where it points after
            printing. Because the destination is under your control and can change at any time, we
            aren&apos;t responsible for the content a dynamic QR code resolves to at the moment
            someone scans it, or for a destination you&apos;ve paused, changed, or removed.
          </p>
        </section>

        <section>
          <h2>File uploads</h2>
          <p className="mt-2">
            File-based QR types have size and format limits enforced by the service — currently 20MB
            for PDFs, 10MB per image, and 15MB for audio files, in the formats listed when you
            create that QR type. We may adjust these limits over time.
          </p>
        </section>

        <section>
          <h2>Service availability</h2>
          <p className="mt-2">
            The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis,
            without warranties of any kind. We don&apos;t guarantee the service will be
            uninterrupted, error-free, or available at all times.
          </p>
        </section>

        <section>
          <h2>Termination</h2>
          <p className="mt-2">
            You can stop using the service at any time. We may suspend or terminate access to an
            account that violates these terms.
          </p>
        </section>

        <section>
          <h2>Changes to these terms</h2>
          <p className="mt-2">
            We&apos;ll update the &quot;last updated&quot; date above when these terms change.
            Continuing to use the service after a change means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p className="mt-2">
            A dedicated contact address for questions about these terms will be added here.
          </p>
        </section>
      </div>
    </div>
  );
}
