import type { ReactNode } from "react";

interface DashboardHeaderProps {
  title: string;
  action?: ReactNode;
}

export function DashboardHeader({ title, action }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      {action}
    </header>
  );
}
