interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex flex-col gap-3 ${alignment}`}>
      {eyebrow ? (
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
      {description ? <p className="max-w-2xl text-muted-foreground">{description}</p> : null}
    </div>
  );
}
