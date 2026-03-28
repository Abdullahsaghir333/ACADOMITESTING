import { Suspense } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Acadomi workspace — uploads, AI notes, and study tools."
    >
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-muted" />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
