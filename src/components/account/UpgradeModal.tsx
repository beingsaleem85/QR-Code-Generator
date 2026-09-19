"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/Button";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="upgrade-modal-title"
      aria-describedby="upgrade-modal-description"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      className="m-auto rounded-2xl border border-border bg-surface p-0 shadow-xl backdrop:bg-foreground/40"
    >
      <div className="flex w-96 max-w-[90vw] flex-col gap-5 p-6 text-center sm:p-7">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
          <Sparkles size={24} aria-hidden="true" />
        </div>

        <div>
          <h2
            id="upgrade-modal-title"
            className="text-lg font-bold tracking-tight text-foreground sm:text-xl"
          >
            Your free trial has ended
          </h2>
          <p
            id="upgrade-modal-description"
            className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm"
          >
            Your 14-day QRForge free trial has expired. Upgrade to Pro to create new QR codes and
            reactivate your dynamic QR codes.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row-reverse sm:gap-3">
          <Link
            href="/pricing"
            onClick={onClose}
            className={buttonVariants({ variant: "primary", size: "lg", className: "w-full sm:flex-1" })}
          >
            Upgrade to Pro
          </Link>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onClose}
            className="w-full sm:flex-1"
          >
            Maybe later
          </Button>
        </div>
      </div>
    </dialog>
  );
}
