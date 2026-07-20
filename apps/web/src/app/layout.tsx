import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppStateProvider } from "@/lib/app-state";
import { AuthProvider } from "@/lib/auth/auth-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Odyssey — Let's speak.",
  description: "Ton coach IA pour parler anglais avec confiance dans la vraie vie.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <AuthProvider>
          <AppStateProvider>{children}</AppStateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
