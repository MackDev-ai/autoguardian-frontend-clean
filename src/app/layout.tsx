import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "../../context/AuthProvider";
import { ToastProvider } from "../../context/ToastContext";
import AuthBridge from "../app/AuthBridge";
import { useEffect } from "react";
import { setUnauthorizedHandler } from "../../lib/api";

export const metadata: Metadata = {
  title: "AutoGuardian – MVP",
  description: "Auth, Garaż, Polisy, Upload PDF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setUnauthorizedHandler(() => {
      console.warn("⛔ Sesja wygasła — przekierowanie na /auth");
      window.location.href = "/auth";
    });
  }, []);

  return (
    <html lang="pl">
      <body>
        <AuthProvider>
          <AuthBridge />
          <ToastProvider> 
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
