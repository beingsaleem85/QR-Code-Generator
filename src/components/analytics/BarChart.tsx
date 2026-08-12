interface BarChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
  ariaLabel: string;
  /** Show an axis label under every Nth bar (e.g. 5 for a 30-day chart). Omit for no axis labels. */
  tickEvery?: number;
}

export function BarChart({ data, ariaLabel, tickEvery }: BarChartProps) {
  const max = Math.max(1, ...data.map((datum) => datum.value));

  return (
    <div>
      <div role="img" aria-label={ariaLabel} className="flex h-36 items-end gap-1">
        {data.map((datum, index) => (
          <div
            key={`${datum.label}-${index}`}
            title={`${datum.label}: ${datum.value}`}
            className="min-w-[3px] flex-1 rounded-t-sm bg-primary/80"
            style={{ height: `${Math.max(4, (datum.value / max) * 100)}%` }}
          />
        ))}
      </div>
      {tickEvery ? (
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          {data
            .filter((_, index) => index % tickEvery === 0)
            .map((datum, index) => (
              <span key={`${datum.label}-${index}`}>{datum.label}</span>
            ))}
        </div>
      ) : null}
    </div>
  );
}
