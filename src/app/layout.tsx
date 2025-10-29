import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "../../context/AuthProvider";
import { ToastProvider } from "../../context/ToastContext";
import AuthBridge from "../app/AuthBridge";

export const metadata: Metadata = {
  title: "AutoGuardian – MVP",
  description: "Auth, Garaż, Polisy, Upload PDF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
