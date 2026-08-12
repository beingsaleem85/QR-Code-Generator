import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-gray-300 p-8 text-center">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {description ? <p className="text-sm text-gray-500">{description}</p> : null}
      {action}
    </div>
  );
}
