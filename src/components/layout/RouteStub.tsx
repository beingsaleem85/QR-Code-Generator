type RouteStubProps = {
  title: string;
  description?: string;
};

/**
 * Structure-phase placeholder for routes that don't have real UI/content yet.
 * Replaced page-by-page during the UI phase (Module 2.x).
 */
export function RouteStub({ title, description }: RouteStubProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
