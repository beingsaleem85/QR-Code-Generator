export default function AuthCallbackPage() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
        role="status"
        aria-label="Signing you in"
      />
      <p className="text-sm text-muted-foreground">Signing you in...</p>
    </div>
  );
}
