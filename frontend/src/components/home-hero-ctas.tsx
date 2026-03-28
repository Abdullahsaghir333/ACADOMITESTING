"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

export function HomeHeroCtas() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-wrap gap-3">
        <div className="h-11 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-11 w-28 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-wrap gap-3">
        <Button className="h-11 px-6 font-medium" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Button variant="outline" className="h-11 px-6 shadow-xs" asChild>
          <Link href="/upload">Uploads</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button className="h-11 px-6 font-medium" asChild>
        <Link href="/signup">Get started</Link>
      </Button>
      <Button variant="outline" className="h-11 px-6 shadow-xs" asChild>
        <Link href="/login">Log in</Link>
      </Button>
    </div>
  );
}
