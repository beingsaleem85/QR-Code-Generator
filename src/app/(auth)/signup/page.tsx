import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

import { safeNext } from "@/lib/auth/safe-redirect";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirectTo?: string }>;
}) {
  const params = await searchParams;
  const target = safeNext(params?.redirectTo);
  const loginHref = target !== "/dashboard" ? `/login?redirectTo=${encodeURIComponent(target)}` : "/login";

  return (
    <AuthCard
      title="Create your account"
      footer={
        <>
          Already have an account?{" "}
          <Link href={loginHref} className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
