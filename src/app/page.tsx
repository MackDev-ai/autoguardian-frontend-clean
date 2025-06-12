"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-8">🚗 AutoGuardian</h1>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/dowod/dodaj-auto"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded text-center"
        >
          ➕ Dodaj auto
        </Link>

        <Link
          href="/dowod/garaz"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded text-center"
        >
          📋 Zobacz garaż
        </Link>

        
        <Link 
          href="/ubezpieczenie/upload" 
          className="
            mt-4 inline-flex items-center justify-center gap-2
            rounded bg-purple-600 px-4 py-2 font-medium text-white
            hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400
           "
        > 
          📑 Dodaj polisę
        </Link>
        <Link
          href="/ubezpieczenie/lista"
          className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          📁 Zobacz zapisane polisy
        </Link>


      </div>
    </main>
  );
}
