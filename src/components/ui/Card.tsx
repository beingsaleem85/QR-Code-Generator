import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface shadow-md ${className ?? ""}`}
      {...props}
    />
  );
}
