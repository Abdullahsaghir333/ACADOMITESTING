"use client";

import * as React from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";

import { MarketingHeader } from "@/components/marketing-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Buddy = { id: string; email: string; status: "pending" | "accepted" };

export default function FriendsPage() {
  const [email, setEmail] = React.useState("");
  const [buddies, setBuddies] = React.useState<Buddy[]>([]);
  const [msg, setMsg] = React.useState<string | null>(null);

  function addFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    const id = crypto.randomUUID();
    setBuddies((prev) => [
      ...prev,
      { id, email: email.trim(), status: "pending" },
    ]);
    setEmail("");
    setMsg(`Invite queued for ${email.trim()} (connect API to persist).`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Friends & study buddies</h1>
          <p className="text-muted-foreground">
            Add classmates for group learning mode — shared AI responses and synchronized
            sessions (backend wiring next).
          </p>
        </div>

        {msg ? (
          <Alert variant="success" className="mt-6">
            <div>
              <AlertTitle>Queued</AlertTitle>
              <AlertDescription>{msg}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        <Card className="mt-8 rounded-xl border border-border shadow-sm">
          <CardHeader>
            <CardTitle>Add a friend</CardTitle>
            <CardDescription>
              Enter their account email. They&apos;ll appear as pending until they accept.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addFriend} className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="friend-email">Friend&apos;s email</Label>
                <Input
                  id="friend-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@university.edu"
                  className="h-11"
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="h-11 shrink-0 gap-2 font-medium">
                <UserPlus className="size-4" />
                Send invite
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col items-stretch border-t border-border pt-6 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {buddies.length === 0
                ? "No friends yet — your list will show here."
                : `${buddies.length} invite(s) in this session.`}
            </p>
            <Button variant="outline" className="shadow-xs" asChild>
              <Link href="/">Home</Link>
            </Button>
          </CardFooter>
        </Card>

        {buddies.length > 0 ? (
          <ul className="mt-8 space-y-3">
            {buddies.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm"
              >
                <span className="font-medium text-foreground">{b.email}</span>
                <span className="text-muted-foreground capitalize">{b.status}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
