import type { ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";

type AlertVariant = "error" | "success";

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
}

const VARIANT_STYLES: Record<AlertVariant, string> = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-success/30 bg-success/10 text-success",
};

const VARIANT_ICON: Record<AlertVariant, typeof CircleAlert> = {
  error: CircleAlert,
  success: CircleCheck,
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
