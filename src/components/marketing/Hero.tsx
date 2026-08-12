import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-20">
      <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-primary">
        Free QR Code Generator
      </span>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Create QR codes people actually want to scan
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Generate, customize, and track QR codes for links, Wi-Fi, contact cards, and more — no
        design skills or account required to get started.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/qr-generator" className={buttonVariants({ variant: "primary", size: "lg" })}>
          Create a QR Code
        </Link>
        <Link href="/qr-types" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          Browse QR Types
        </Link>
      </div>
    </section>
  );
}
