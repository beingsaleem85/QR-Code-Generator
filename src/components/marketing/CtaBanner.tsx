import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";

export function CtaBanner() {
  return (
    <section className="bg-primary">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-semibold text-primary-foreground sm:text-3xl">
          Ready to create your first QR code?
        </h2>
        <p className="max-w-md text-primary-foreground/85">
          It takes less than a minute — no account required to start.
        </p>
        <Link href="/qr-generator" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          Get Started for Free
        </Link>
      </div>
    </section>
  );
}
