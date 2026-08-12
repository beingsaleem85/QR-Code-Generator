import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-4">
      <Logo />
      {children}
    </div>
  );
}
