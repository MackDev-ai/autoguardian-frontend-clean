"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoGuardian",
  description: "Twoje miejsce do zarządzania polisami",
};

function Navbar() {
  const router = useRouter();

  function handleLogout() {
    Cookies.remove("token");
    router.push("/login");
  }

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-gray-900 text-white">
      <h1
        className="text-xl font-bold cursor-pointer"
        onClick={() => router.push("/")}
      >
        🚗 AutoGuardian
      </h1>
      <div className="space-x-4">
        <button
          onClick={() => router.push("/polisy")}
          className="hover:underline"
        >
          Polisy
        </button>
        <button
          onClick={() => router.push("/me")}
          className="hover:underline"
        >
          Profil
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
        >
          Wyloguj się
        </button>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        <Navbar />
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
