import type { DistributionEntry } from "@/types/analytics";

interface DistributionListProps {
  entries: DistributionEntry[];
  labelFormatter?: (label: string) => string;
}

export function DistributionList({ entries, labelFormatter }: DistributionListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.label} className="flex items-center gap-3 text-sm">
          <span className="w-20 shrink-0 truncate text-foreground">
            {labelFormatter ? labelFormatter(entry.label) : entry.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${entry.percentage}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
            {entry.count} ({entry.percentage}%)
          </span>
        </li>
      ))}
    </ul>
  );
}
