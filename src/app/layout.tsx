import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "../../context/AuthProvider";


"use client";
import { useEffect } from "react";
import { setUnauthorizedHandler } from "../../lib/api";
import { useAuth } from "../../context/AuthProvider";

function AuthBridge() {
  const { setToken } = useAuth();
  useEffect(() => {
    setUnauthorizedHandler(() => setToken(null));
  }, [setToken]);
  return null;
}

export const metadata: Metadata = {
  title: "AutoGuardian – MVP",
  description: "Auth, Garaż, Polisy, Upload PDF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
