"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/Button";

interface MobileNavDrawerProps {
  links: readonly { label: string; href: string }[];
  cta?: { label: string; href: string };
  /** Extra content rendered below the nav links, e.g. a dashboard log-out action. */
  footer?: ReactNode;
}

/**
 * Uses the native <dialog> element in modal mode: the browser handles
 * focus trapping and Escape-to-close for free, so this component only
 * needs to manage open/close state and backdrop-click dismissal.
 */
export function MobileNavDrawer({ links, cta, footer }: MobileNavDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => setOpen(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  const openDrawer = () => {
    dialogRef.current?.showModal();
    setOpen(true);
  };
  const closeDrawer = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={openDrawer}
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        aria-label="Open menu"
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground hover:bg-background md:hidden"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <dialog
        id="mobile-nav-drawer"
        ref={dialogRef}
        aria-label="Navigation menu"
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDrawer();
        }}
        className="fixed inset-y-0 right-0 m-0 w-72 max-w-[85vw] border-l border-border bg-surface p-0 open:flex open:flex-col backdrop:bg-foreground/40"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="text-sm font-semibold text-foreground">Menu</span>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground hover:bg-background"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <nav aria-label="Mobile" className="flex flex-col gap-1 p-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeDrawer}
              className="rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-background"
            >
              {link.label}
            </Link>
          ))}
          {cta ? (
            <Link
              href={cta.href}
              onClick={closeDrawer}
              className={buttonVariants({ variant: "primary", className: "mt-2 w-full" })}
            >
              {cta.label}
            </Link>
          ) : null}
          {footer}
        </nav>
      </dialog>
    </>
  );
}
