import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join Acadomi for AI-led teaching, debates, and collaborative study."
    >
      <SignupForm />
    </AuthLayout>
  );
}
