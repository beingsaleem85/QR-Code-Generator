import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";

type AlertVariant = "error" | "success" | "info";

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
}

const VARIANT_STYLES: Record<AlertVariant, string> = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-success/30 bg-success/10 text-success",
  info: "border-primary/30 bg-primary/10 text-primary",
};

const VARIANT_ICON: Record<AlertVariant, typeof CircleAlert> = {
  error: CircleAlert,
  success: CircleCheck,
  info: Info,
};

export function Alert({ variant, children }: AlertProps) {
  const Icon = VARIANT_ICON[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${VARIANT_STYLES[variant]}`}
    >
      <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
