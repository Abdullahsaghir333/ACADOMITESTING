"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { MarketingHeader } from "@/components/marketing-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { apiUpdateProfile, getToken } from "@/lib/api";

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function onProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    const t = getToken();
    if (!t) return;
    setLoading(true);
    const form = e.currentTarget;
    try {
      await apiUpdateProfile(t, {
        firstName: (form.elements.namedItem("firstName") as HTMLInputElement).value,
        lastName: (form.elements.namedItem("lastName") as HTMLInputElement).value,
      });
      await refresh();
      setMsg("Profile updated.");
    } catch (er) {
      setErr(er instanceof Error ? er.message : "Update failed.");
    } finally {
      setLoading(false);
    }
  }

  async function onPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    const t = getToken();
    if (!t) return;
    setLoading(true);
    const form = e.currentTarget;
    const currentPassword = (form.elements.namedItem("currentPassword") as HTMLInputElement)
      .value;
    const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
    try {
      await apiUpdateProfile(t, { currentPassword, newPassword });
      (form.elements.namedItem("currentPassword") as HTMLInputElement).value = "";
      (form.elements.namedItem("newPassword") as HTMLInputElement).value = "";
      setMsg("Password changed.");
    } catch (er) {
      setErr(er instanceof Error ? er.message : "Could not change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Account details for <span className="font-medium text-foreground">{user?.email}</span>
          </p>
        </div>

        {msg ? (
          <Alert variant="success" className="mt-6">
            <div>
              <AlertTitle>Saved</AlertTitle>
              <AlertDescription>{msg}</AlertDescription>
            </div>
          </Alert>
        ) : null}
        {err ? (
          <Alert variant="destructive" className="mt-6">
            <div>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{err}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        <Card className="mt-8 rounded-xl border border-border shadow-sm">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your name appears across the app and on exported materials.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onProfile} className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    key={user?.firstName}
                    defaultValue={user?.firstName}
                    className="h-11"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    key={user?.lastName}
                    defaultValue={user?.lastName}
                    className="h-11"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="h-11 w-fit font-medium" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6 rounded-xl border border-border shadow-sm">
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Choose a strong password for your university demo account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onPassword} className="flex flex-col gap-5">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <PasswordInput id="currentPassword" name="currentPassword" className="h-11" required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <PasswordInput
                  id="newPassword"
                  name="newPassword"
                  className="h-11"
                  minLength={8}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" variant="secondary" className="h-11 w-fit font-medium" disabled={loading}>
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="text-primary hover:underline">
            Back to dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}
