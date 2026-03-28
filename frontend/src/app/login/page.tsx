import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your sessions, bookmarks, and group study."
    >
      <LoginForm />
    </AuthLayout>
  );
}
