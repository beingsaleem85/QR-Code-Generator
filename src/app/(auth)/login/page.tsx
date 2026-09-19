import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

import { safeNext } from "@/lib/auth/safe-redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirectTo?: string }>;
}) {
  const params = await searchParams;
  const target = safeNext(params?.redirectTo);
  const signupHref = target !== "/dashboard" ? `/signup?redirectTo=${encodeURIComponent(target)}` : "/signup";

  const hasRedirect = Boolean(params?.redirectTo);
  const title = hasRedirect ? "Sign in to continue" : "Log in";
  const description = hasRedirect
    ? "Create a free account or sign in to generate, download, and manage your QR codes."
    : undefined;

  return (
    <AuthCard
      title={title}
      description={description}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href={signupHref} className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
