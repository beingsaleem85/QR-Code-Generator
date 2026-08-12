import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";

interface SettingRowProps {
  label: string;
  description: string;
  children: ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <Card className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </Card>
  );
}

/**
 * Every control here is intentionally disabled. The master prompt's Module
 * 2.9 spec explicitly warns against "fake toggles" — an enabled control
 * that silently does nothing — so these are visibly inert instead, with a
 * note on what has to exist first, matching every other premature action
 * in this app (Download/Save/Archive/Delete buttons elsewhere).
 */
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader title="Settings" />

      <div className="flex flex-col gap-4 px-4 pb-6 sm:px-6 lg:max-w-lg">
        <SettingRow
          label="Default QR design"
          description="Applied automatically to new QR codes. Available once you've saved a design preset."
        >
          <Select disabled defaultValue="default" aria-label="Default QR design">
            <option value="default">Default</option>
          </Select>
        </SettingRow>

        <SettingRow
          label="Default download format"
          description="Used for the one-click download action. Arrives with QR image export in Module 3.4."
        >
          <Select disabled defaultValue="png" aria-label="Default download format">
            <option value="png">PNG</option>
            <option value="svg">SVG</option>
          </Select>
        </SettingRow>

        <SettingRow
          label="Analytics privacy"
          description="Controls how much scan detail is collected for dynamic QR codes. Arrives with scan tracking in Module 3.7."
        >
          <Select disabled defaultValue="standard" aria-label="Analytics privacy">
            <option value="standard">Standard</option>
            <option value="minimal">Minimal</option>
          </Select>
        </SettingRow>
      </div>
    </div>
  );
}
