"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface GoogleAuthButtonProps {
  text?: string;
  redirectTo?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
  className?: string;
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  text = "Continue with Google",
  redirectTo = "/dashboard",
  disabled = false,
  onError,
  className = "",
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (loading || disabled) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const targetParam =
        redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
          ? `?next=${encodeURIComponent(redirectTo)}`
          : "";
      const callbackUrl = `${origin}/auth/callback${targetParam}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) {
        setLoading(false);
        onError?.(error.message);
      }
    } catch {
      setLoading(false);
      onError?.("Failed to initiate sign in with Google. Please try again.");
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleSignIn}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`w-full flex items-center justify-center gap-2.5 font-medium ${className}`}
    >
      <GoogleIcon />
      <span>{loading ? "Connecting to Google..." : text}</span>
    </Button>
  );
}
