import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href="/"
        className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background"
      >
        Back to home
      </Link>
    </div>
  );
}
