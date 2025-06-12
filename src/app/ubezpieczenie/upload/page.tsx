"use client";

import { useState } from "react";
import Link from "next/link";

type ExtractedData = {
  numerPolisy: string;
  ubezpieczyciel: string;
  ubezpieczony: string;
  pojazd: string;
  zakres: string[];
  okres: {
    od: string;
    do: string;
  };
  sumaUbezpieczenia: string;
  skladka: string;
  udzialWlasny: string;
  amortyzacja: string;
};

export default function UploadInsurancePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("https://autoguardian-backend.onrender.com/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setOcrText(result.ocr_text);
      setExtracted(result.extracted);
      // 🆕 Zapisz dane do backendu
      await fetch("https://autoguardian-backend.onrender.com/zapisz-polise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.extracted),
      });



    } catch (error) {
      console.error("Błąd podczas przesyłania pliku:", error);
    }

    setLoading(false);
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Wyślij polisę ubezpieczeniową (PDF)</h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Przetwarzanie..." : "Wyślij PDF"}
      </button>

      {extracted && (
        <div className="mt-6 p-4 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <h2 className="text-xl font-semibold mb-2">Dane z polisy:</h2>

          <ul className="space-y-2 text-sm">
            <li><strong>📄 Numer polisy:</strong> {extracted.numerPolisy}</li>
            <li><strong>🏢 Ubezpieczyciel:</strong> {extracted.ubezpieczyciel}</li>
            <li><strong>👤 Ubezpieczony:</strong> {extracted.ubezpieczony}</li>
            <li><strong>🚗 Pojazd:</strong> {extracted.pojazd}</li>
            <li>
              <strong>📅 Okres:</strong> od <em>{extracted.okres?.od}</em> do <em>{extracted.okres?.do}</em>
            </li>
            <li><strong>🛡️ Zakres:</strong> {(extracted.zakres || []).join(", ")}</li>
            <li>
              <strong>💰 Składka:</strong>
              <pre className="whitespace-pre-wrap">{extracted.skladka}</pre>
            </li>
            <li><strong>💸 Suma ubezpieczenia:</strong> {extracted.sumaUbezpieczenia}</li>
            <li><strong>📉 Udział własny:</strong> {extracted.udzialWlasny}</li>
            <li><strong>🧾 Amortyzacja:</strong> {extracted.amortyzacja}</li>
          </ul>
        </div>
      )}

      {ocrText && (
        <div
          className="
            mt-6 rounded p-4 overflow-auto
            bg-gray-100 text-gray-900
            dark:bg-gray-800 dark:text-gray-100
          "
        >
          <h2 className="text-xl font-semibold mb-2">Zawartość PDF (OCR):</h2>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">{ocrText}</pre>
        </div>
      )}

      <Link href="/" className="text-blue-400 hover:underline mt-6 block text-sm">
        ← Wróć na stronę główną
      </Link>
    </main>
  );
}
