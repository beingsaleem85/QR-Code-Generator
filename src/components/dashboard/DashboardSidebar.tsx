const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard" },
  { label: "QR Codes", href: "/dashboard/qr-codes" },
  { label: "Create QR", href: "/dashboard/qr-codes/new" },
  { label: "Files", href: "/dashboard/files" },
  { label: "Account", href: "/dashboard/account" },
  { label: "Settings", href: "/dashboard/settings" },
] as const;

interface DashboardSidebarProps {
  activePath?: string;
}

export function DashboardSidebar({ activePath }: DashboardSidebarProps) {
  return (
    <nav aria-label="Dashboard" className="flex w-56 flex-col gap-1 border-r border-gray-200 p-3">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.href}
          href={item.href}
          aria-current={activePath === item.href ? "page" : undefined}
          className={`rounded-md px-3 py-2 text-sm ${
            activePath === item.href ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
