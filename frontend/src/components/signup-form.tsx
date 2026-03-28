"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { DIAL_CODES } from "@/lib/phone-regions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function SignupForm() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [dial, setDial] = React.useState<string>(DIAL_CODES[0].value);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setSuccess("Check your inbox to confirm your email (demo).");
    }, 900);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("flex flex-col gap-5", loading && "opacity-70")}
    >
      {success ? (
        <Alert variant="success">
          <div>
            <AlertTitle>Account created</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </div>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <div>
            <AlertTitle>Sign up failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
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
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Label htmlFor="phone">Phone number</Label>
          <span className="text-xs text-muted-foreground">Country: detecting…</span>
        </div>
        <div className="flex gap-2">
          <select
            id="dial"
            name="dialCode"
            value={dial}
            onChange={(e) => setDial(e.target.value)}
            disabled={loading}
            className={cn(
              "flex h-11 shrink-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none",
              "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              "dark:bg-input/30 disabled:opacity-50",
            )}
            aria-label="Country dial code"
          >
            {DIAL_CODES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="123 456 7890"
            className="h-11 flex-1 text-base md:text-sm"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <PasswordInput
          id="signup-password"
          name="password"
          autoComplete="new-password"
          required
          className="h-11 text-base md:text-sm"
          disabled={loading}
        />
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
          className="font-medium text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-sm"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
