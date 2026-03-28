"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { apiRegister } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function SignupForm() {
  const router = useRouter();
  const { signIn, user, ready } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (ready && user) {
      router.replace("/dashboard");
    }
  }, [ready, user, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value;
    const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    try {
      const { token, user } = await apiRegister({
        email,
        password,
        firstName,
        lastName,
      });
      signIn(token, user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={cn("flex flex-col gap-5", loading && "opacity-70")}>
      {error ? (
        <Alert variant={error.includes("already exists") ? "default" : "destructive"}>
          <div>
            <AlertTitle>
              {error.includes("already exists")
                ? "You already have an account"
                : "Sign up failed"}
            </AlertTitle>
            <AlertDescription className="space-y-2">
              <span>{error}</span>
              {error.includes("already exists") ? (
                <span className="block">
                  <Link
                    href="/login"
                    className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-sm"
                  >
                    Log in with this email
                  </Link>{" "}
                  or use a different address to register again.
                </span>
              ) : null}
            </AlertDescription>
          </div>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first">First name</Label>
          <Input
            id="first"
            name="firstName"
            autoComplete="given-name"
            required
            className="h-11 text-base md:text-sm"
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last">Last name</Label>
          <Input
            id="last"
            name="lastName"
            autoComplete="family-name"
            required
            className="h-11 text-base md:text-sm"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="m@example.com"
          required
          className="h-11 text-base md:text-sm"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <PasswordInput
          id="signup-password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="h-11 text-base md:text-sm"
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>

      <Button type="submit" className="h-11 w-full font-medium" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="rounded-sm font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
