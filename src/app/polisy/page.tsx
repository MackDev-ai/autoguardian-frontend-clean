"use client";

import React, { useEffect, useState } from "react";
import { useAuth, authHeaders } from "../../../context/AuthProvider";

type Polisa = {
  id: number;
  created_at: string;
  // później rozszerzymy o więcej pól (nr polisy, ubezpieczyciel itd.)
};

export default function PolisyPage() {
  const { token, isAuthed } = useAuth(); // 👈 token z AuthProvider
  const [polisy, setPolisy] = useState<Polisa[]>([]);
  const [loadingPolisy, setLoadingPolisy] = useState(true);

  const fetchPolisy = async (authToken: string | null) => {
    setLoadingPolisy(true);
    try {
      if (!authToken) {
        console.warn("Brak tokenu – użytkownik nie jest zalogowany.");
        setPolisy([]);
        setLoadingPolisy(false);
        return;
      }

      console.log("🔑 Token w /polisy (z AuthProvider):", authToken);

      const res = await fetch("https://api.autoguardian.pl/pobierz-polisy", {
        method: "GET",
        headers: {
          ...authHeaders(authToken), // Authorization: Bearer <token>
        },
      });

      const data = await res.json();

      if (res.status === 401) {
        console.warn("401 przy pobieraniu polis – sesja wygasła.");
        alert("Sesja wygasła lub brak autoryzacji. Zaloguj się ponownie.");
        setPolisy([]);
        setLoadingPolisy(false);
        return;
      }

      if (!res.ok) {
        console.error("Błąd pobierania polis:", data);
        alert("Błąd pobierania polis: " + (data.detail || "Nieznany błąd"));
        setPolisy([]);
        return;
      }

      setPolisy(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Błąd połączenia z API (pobierz-polisy):", error);
      alert("Nie udało się pobrać polis.");
      setPolisy([]);
    } finally {
      setLoadingPolisy(false);
    }
  };

  useEffect(() => {
    // kiedy token się pojawi / zmieni, próbujemy pobrać polisy
    fetchPolisy(token);
  }, [token]);

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
          {/* placeholder pod input pliku – w kolejnym kroku podłączymy prawdziwy upload */}
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
            Na kolejnym etapie w tym bloku podłączymy upload PDF, wywołanie OCR
            i zapis polisy do bazy.
          </p>
        </div>
      </section>

      {/* Sekcja: Lista polis */}
      <section className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
        <h2 className="text-xl font-bold mb-2">Twoje polisy</h2>
        <p className="text-sm text-slate-300 mb-4">
          Lista polis pobrana z backendu. Na razie pokazujemy podstawowe dane;
          później rozbudujemy widok o szczegóły polisy.
        </p>

        {!isAuthed ? (
          <div className="rounded bg-slate-800 p-4 text-sm text-slate-300">
            Musisz być zalogowany, aby zobaczyć swoje polisy.
          </div>
        ) : loadingPolisy ? (
          <div className="rounded bg-slate-800 p-4 text-sm text-slate-300">
            Ładowanie polis...
          </div>
        ) : polisy.length === 0 ? (
          <div className="rounded bg-slate-800 p-4 text-sm text-slate-400">
            Brak zapisanych polis w bazie.
          </div>
        ) : (
          <ul className="space-y-2 text-sm">
            {polisy.map((p) => (
              <li
                key={p.id}
                className="p-3 rounded bg-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-semibold">ID polisy:</span> {p.id}
                </div>
                <div className="text-xs text-slate-300 mt-1 sm:mt-0">
                  Utworzono:{" "}
                  {p.created_at
                    ? new Date(p.created_at).toLocaleString("pl-PL")
                    : "-"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
