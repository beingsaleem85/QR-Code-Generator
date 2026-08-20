import type { ReactNode } from "react";

interface DashboardHeaderProps {
  title: string;
  action?: ReactNode;
}

export function DashboardHeader({ title, action }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-4 sm:px-6">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
      {action}
    </header>
  );
}
