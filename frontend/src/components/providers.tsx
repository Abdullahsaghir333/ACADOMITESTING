"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";

/** next-themes + React 19: package typings omit `children` in some TS setups */
const Themed = ThemeProvider as React.ComponentType<
  React.ComponentProps<typeof ThemeProvider> & { children: React.ReactNode }
>;

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Themed
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </Themed>
  );
}
