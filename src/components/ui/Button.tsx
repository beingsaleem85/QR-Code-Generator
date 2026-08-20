import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-primary to-primary-hover text-primary-foreground shadow-md hover:shadow-lg hover:brightness-105",
  secondary:
    "border border-border bg-surface text-foreground shadow-sm hover:border-primary/40 hover:bg-background",
  destructive: "bg-destructive text-destructive-foreground shadow-sm hover:opacity-90",
  ghost: "text-foreground hover:bg-background",
};

// Matches --control-height-sm/md/lg in globals.css (2rem / 2.5rem / 3rem).
const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

/**
 * Shared with any element that needs to *look* like a Button without being
 * one — most commonly a `next/link` CTA, which can't render as a
 * `<button>`. Keeps the two in visual lockstep without duplicating the
 * variant/size class tables.
 */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return `inline-flex items-center justify-center rounded-full font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className ?? ""}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonVariants({ variant, size, className })} {...props} />;
}
