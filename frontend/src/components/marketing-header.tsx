"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

import { mainNav, platformNav } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 border-b border-border bg-background transition-colors"
      style={{ minHeight: "var(--header-height)" }}
    >
      <div className="mx-auto flex h-[var(--header-height)] max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/logo.svg" alt="Acadomi" width={40} height={40} className="size-10" />
          <span className="font-semibold text-foreground">Acadomi</span>
        </Link>

        <Separator orientation="vertical" className="hidden h-4 sm:block" />

        <nav className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {item.label}
            </Link>
          ))}
          <div
            className="relative"
            onMouseEnter={() => setMega(true)}
            onMouseLeave={() => setMega(false)}
          >
            <button
              type="button"
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              aria-expanded={mega}
              aria-haspopup="true"
            >
              Platform
              <ChevronDown className="size-4 opacity-70" />
            </button>
            {mega ? (
              <div className="absolute left-0 top-full z-50 pt-2">
                <div className="flex min-w-[min(100vw-2rem,42rem)] gap-6 rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-sm">
                  <MegaColumn title="Learn & collaborate" items={platformNav.learn} />
                  <MegaColumn title="Study & revision" items={platformNav.study} />
                  <MegaColumn title="Engagement" items={platformNav.engagement} />
                  <MegaColumn title="Social" items={platformNav.social} />
                </div>
              </div>
            ) : null}
          </div>
        </nav>

        <span className="flex-1" />

        <div className="hidden items-center gap-2 sm:flex">
          <ThemeToggle />
          <Button variant="outline" className="shadow-xs" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button className="font-medium" asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon"
            className="shadow-xs"
            aria-label="Open menu"
            onClick={() => setOpen((o) => !o)}
          >
            <Menu className="size-4" />
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Platform (coming soon)
            </p>
            {[
              ...platformNav.learn,
              ...platformNav.study,
              ...platformNav.engagement,
              ...platformNav.social,
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  item.href === "/friends" && "text-foreground font-medium",
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              <Button variant="outline" className="w-full shadow-xs" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button className="w-full" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function MegaColumn({
  title,
  items,
}: {
  title: string;
  items: readonly { href: string; label: string }[];
}) {
  return (
    <div className="min-w-[10rem] space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
