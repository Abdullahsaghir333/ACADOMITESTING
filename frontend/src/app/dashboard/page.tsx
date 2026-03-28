"use client";

import Link from "next/link";
import { BookOpen, Upload } from "lucide-react";
import { useEffect, useState } from "react";

import { MarketingHeader } from "@/components/marketing-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { apiListUploads, getToken } from "@/lib/api";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [uploadCount, setUploadCount] = useState<number | null>(null);
  const [maxUploads, setMaxUploads] = useState(7);

  useEffect(() => {
    const t = getToken();
    if (!t) return;
    apiListUploads(t)
      .then((d) => {
        setUploadCount(d.uploads.length);
        setMaxUploads(d.maxUploads);
      })
      .catch(() => setUploadCount(0));
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {authLoading ? "Hello" : `Hello, ${user?.firstName ?? "learner"}`}
          </h1>
          <p className="text-muted-foreground">
            Your materials are processed with Gemini and stored in MongoDB — ready for tutor
            mode, podcasts, and revision features as you build them out.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Card className="rounded-xl border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="size-5 text-primary" />
                Multi-input uploads
              </CardTitle>
              <CardDescription>
                PDFs, images, or audio — add an optional prompt for how Gemini should summarize.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/upload">Manage uploads</Link>
              </Button>
              <p className="w-full text-sm text-muted-foreground">
                {uploadCount === null
                  ? "Loading upload count…"
                  : `${uploadCount} / ${maxUploads} slots used`}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="size-5 text-primary" />
                Platform roadmap
              </CardTitle>
              <CardDescription>
                AI tutor, group study, bookmarks, focus detection, and podcast mode connect to
                these saved materials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="shadow-xs" asChild>
                <Link href="/#features">View feature map</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
