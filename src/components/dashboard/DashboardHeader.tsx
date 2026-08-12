interface DashboardHeaderProps {
  title: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
    </header>
  );
}
