"use client";

import React from "react";

export default function PolisyPage() {
  return (
    <main className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Sekcja: Dodaj polisę z PDF (OCR) */}
      <section className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
        <h1 className="text-2xl font-bold mb-2">Dodaj polisę</h1>
        <p className="text-sm text-slate-300 mb-4">
          Możesz dodać nową polisę z pliku PDF (OCR). Później w tym miejscu
          pojawi się formularz uploadu i podgląd wyodrębnionych danych.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* placeholder pod input pliku */}
          <input
            type="file"
            disabled
            className="text-sm opacity-60 cursor-not-allowed"
          />
          <button
            disabled
            className="px-4 py-2 rounded bg-blue-600/50 text-white text-sm cursor-not-allowed"
          >
            Wyślij i przetwórz (wkrótce)
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-400">
          <p>
            Na kolejnym etapie w tym bloku podłączymy prawdziwy upload PDF,
            wywołanie OCR i zapis polisy do bazy.
          </p>
        </div>
      </section>

      {/* Sekcja: Lista polis */}
      <section className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
        <h2 className="text-xl font-bold mb-2">Twoje polisy</h2>
        <p className="text-sm text-slate-300 mb-4">
          Tutaj pojawi się lista polis pobrana z backendu. Na razie to tylko
          placeholder, żeby ustalić layout.
        </p>

        <div className="rounded bg-slate-800 p-4 text-sm text-slate-400">
          Brak danych – backend podłączymy w następnym kroku.
        </div>
      </section>
    </main>
  );
}
