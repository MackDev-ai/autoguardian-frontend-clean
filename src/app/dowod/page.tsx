"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-8">🚗 AutoGuardian</h1>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="dowod/dodaj-auto"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded text-center"
        >
          ➕ Dodaj auto
        </Link>

        <Link
          href="dowod/garaz"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded text-center"
        >
          📋 Zobacz garaż
        </Link>
      </div>
    </main>
  );
}
