"use client";

import React, { useEffect, useState } from "react";
import { useAuth, authHeaders } from "../../../context/AuthProvider";

type Polisa = {
  id: string;
  number: string | null;
  insurer: string | null;
  premium: string | number | null;
  valid_from: string | null;
  valid_to: string | null;
  deductible: string | number | null;
  coverage: string[] | string | null;
};

type ExtractedValue = string | number | boolean | null | undefined;

type ExtractedData = {
  policy_number?: string;
  insurer?: string;
  premium?: string | number;
  start_date?: string;
  end_date?: string;
  deductible?: string | number;
  scope?: string;
  [key: string]: ExtractedValue;
};

export default function PolisyPage() {
  const { token, isAuthed } = useAuth();

  // --- stan dla listy polis ---
  const [polisy, setPolisy] = useState<Polisa[]>([]);
  const [loadingPolisy, setLoadingPolisy] = useState(true);

  // --- stan dla uploadu PDF / OCR ---
  const [file, setFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [ocrText, setOcrText] = useState<string>("");
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);

  // ===========================
  //  POBIERANIE POLIS Z BACKENDU
  // ===========================
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
          ...authHeaders(authToken),
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
    fetchPolisy(token);
  }, [token]);

  // ===========================
  //  UPLOAD PDF + OCR + ZAPIS
  // ===========================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setOcrText("");
    setExtracted(null);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Wybierz plik PDF");
      return;
    }
    if (!token) {
      alert("Brak tokenu. Zaloguj się ponownie.");
      return;
    }

    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 1) OCR – wysyłamy PDF na backend
      const ocrRes = await fetch("https://api.autoguardian.pl/upload-pdf", {
        method: "POST",
        headers: {
          ...authHeaders(token),
        },
        body: formData,
      });

      const ocrData = await ocrRes.json();

      if (ocrRes.status === 401) {
        alert("Sesja wygasła lub brak autoryzacji. Zaloguj się ponownie.");
        return;
      }

      if (!ocrRes.ok) {
        console.error("Błąd OCR:", ocrData);
        alert(
          "Błąd podczas przetwarzania PDF: " +
            (ocrData.detail || "Nieznany błąd")
        );
        return;
      }

      const extractedData: ExtractedData | null =
        (ocrData.extracted as ExtractedData) || null;

      setOcrText(ocrData.ocr_text || ocrData.raw_text || "");
      setExtracted(extractedData);

      console.log("✅ Wynik OCR:", ocrData);

      // 2) ZAPIS POLISY – wysyłamy wyodrębnione dane do /zapisz-polise
      if (!extractedData) {
        alert("Brak wyodrębnionych danych z PDF – nie można zapisać polisy.");
        return;
      }

      const saveRes = await fetch("https://api.autoguardian.pl/zapisz-polise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({ data: extractedData }),
      });

      const saveData = await saveRes.json();

      if (saveRes.status === 401) {
        alert("Sesja wygasła lub brak autoryzacji przy zapisie polisy.");
        return;
      }

      if (!saveRes.ok) {
        console.error("Błąd zapisu polisy:", saveData);
        alert(
          "Błąd zapisu polisy: " +
            (saveData.detail || "Nieznany błąd podczas zapisu")
        );
        return;
      }

      alert("Polisa została zapisana w bazie.");

      setFile(null);
      setOcrText("");
      setExtracted(null);

      await fetchPolisy(token);
    } catch (error) {
      console.error("Błąd podczas uploadu PDF / zapisu polisy:", error);
      alert("Nie udało się przetworzyć pliku lub zapisać polisy.");
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Sekcja: Dodaj polisę z PDF (OCR) */}
      <section className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
        <h1 className="text-2xl font-bold mb-2">Dodaj polisę</h1>
        <p className="text-sm text-slate-300 mb-4">
          Możesz dodać nową polisę z pliku PDF (OCR). Po przetworzeniu pliku
          zapisujemy polisę w bazie i odświeżamy listę poniżej.
        </p>

        {!isAuthed ? (
          <div className="rounded bg-slate-800 p-4 text-sm text-slate-300">
            Musisz być zalogowany, aby dodać polisę z PDF.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="text-sm"
              />
              <button
                onClick={handleUpload}
                disabled={!file || uploadLoading}
                className="px-4 py-2 rounded bg-blue-600 disabled:bg-blue-900 text-white text-sm"
              >
                {uploadLoading ? "Przetwarzanie..." : "Wyślij i przetwórz"}
              </button>
            </div>

            {/* Podgląd wyodrębnionych danych */}
            {extracted && (
              <div className="mt-4 text-sm bg-slate-800 rounded p-3 max-h-64 overflow-auto">
                <h2 className="font-semibold mb-2">
                  Podgląd danych z PDF (extracted):
                </h2>
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(extracted, null, 2)}
                </pre>
              </div>
            )}

            {/* Wynik OCR (raw) */}
            {ocrText && (
              <div className="mt-4 text-xs bg-slate-800 rounded p-3 max-h-64 overflow-auto">
                <h2 className="font-semibold mb-2">Wynik OCR (raw):</h2>
                <pre className="whitespace-pre-wrap break-words">
                  {ocrText}
                </pre>
              </div>
            )}
          </>
        )}

        <div className="mt-4 text-xs text-slate-400">
          <p>
            Dane z OCR możesz później wykorzystać do porównań polis i
            przypomnień o końcu okresu ubezpieczenia.
          </p>
        </div>
      </section>

      {/* Sekcja: Lista polis */}
      <section className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
        <h2 className="text-xl font-bold mb-2">Twoje polisy</h2>
        <p className="text-sm text-slate-300 mb-4">
          Lista polis pobrana z backendu. Wyświetlamy podstawowe informacje;
          później rozbudujemy widok o szczegóły i status wygasania.
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
          <ul className="space-y-3 text-sm">
            {polisy.map((p) => {
              const coverageLabel = Array.isArray(p.coverage)
                ? p.coverage.join(", ")
                : p.coverage || "brak danych";

              return (
                <li
                  key={p.id}
                  className="p-4 rounded bg-slate-800 border border-slate-700 flex flex-col gap-1"
                >
                  <div className="font-semibold text-base">
                    {p.number || "(brak numeru polisy)"}{" "}
                    <span className="text-xs text-slate-400 ml-2">
                      ID: {p.id}
                    </span>
                  </div>

                  <div className="text-slate-200">
                    Ubezpieczyciel:{" "}
                    <span className="font-medium">
                      {p.insurer || "brak danych"}
                    </span>
                  </div>

                  <div className="text-slate-200">
                    Składka:{" "}
                    <span className="font-medium">
                      {p.premium != null ? `${p.premium} zł` : "brak danych"}
                    </span>
                  </div>

                  <div className="text-slate-200 text-sm">
                    Okres:{" "}
                    <span className="font-medium">
                      {p.valid_from || "?"} {" → "} {p.valid_to || "?"}
                    </span>
                  </div>

                  <div className="text-slate-200 text-sm">
                    Udział własny:{" "}
                    <span className="font-medium">
                      {p.deductible != null ? p.deductible : "brak danych"}
                    </span>
                  </div>

                  <div className="text-slate-200 text-sm">
                    Zakres:{" "}
                    <span className="font-medium">{coverageLabel}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
