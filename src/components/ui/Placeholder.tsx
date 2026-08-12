interface PlaceholderProps {
  label: string;
  description?: string;
  className?: string;
}

/**
 * Neutral structural filler used by Structure-phase component skeletons.
 * Replaced by real content/styling in Phase 2 — components keep their own
 * typed props contract, they just render through this internally.
 */
export function Placeholder({ label, description, className }: PlaceholderProps) {
  return (
    <div className={`rounded-lg border border-dashed border-border p-4 ${className ?? ""}`}>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}
