import { logout } from "@/lib/supabase/actions";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({
  className = "rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-background",
}: LogoutButtonProps) {
  return (
    <form action={logout}>
      <button type="submit" className={`w-full ${className}`}>
        Log out
      </button>
    </form>
  );
}
