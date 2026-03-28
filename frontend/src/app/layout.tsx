import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Manrope } from "next/font/google";
import Script from "next/script";

import "./globals.css";
import { Providers } from "@/components/providers";
import { AuthProvider } from "@/context/auth-context";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Acadomi — AI-Powered Personalized Learning",
  description:
    "Interactive AI teaching, group study, focus detection, and revision tools for higher-ed learners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground" suppressHydrationWarning>
        {/*
          Apply saved theme before React hydrates. Inline body must use dangerouslySetInnerHTML so React
          does not treat executable script source as renderable children (React 19 / Next Script).
        */}
        <Script
          id="acadomi-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='theme';var d=document.documentElement;var s=localStorage.getItem(k)||'system';var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=s==='system'?(m?'dark':'light'):s;if(r!=='light'&&r!=='dark')r=m?'dark':'light';d.classList.remove('light','dark');d.classList.add(r);d.style.colorScheme=r==='dark'?'dark':'light';}catch(e){}})();`,
          }}
        />
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
