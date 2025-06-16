"use client";

import { useState } from "react";
import Link from "next/link";

type Polisa = {
  numerPolisy: string;
  numerSprawy: string;
  dataZawarcia: string;
  okres: {
    od: string;
    do: string;
  };
  ubezpieczyciel: string;
  ubezpieczajacy: {
    imieNazwisko: string;
    nip: string;
    regon: string;
    adres: string;
    telefon: string;
  };
  pojazd: {
    marka: string;
    model: string;
    vin: string;
    nrRejestracyjny: string;
    pojemnosc: string;
    rokProdukcji: string;
    pierwszaRejestracja: string;
  };
  zakres: {
    oc: { sumaOsoba: string; sumaMienie: string; skladka: string };
    ac: { suma: string; skladka: string };
    nnw: { suma: string; skladka: string };
    assistanceSos: { suma: string; skladka: string };
    assistancePrawny: { suma: string; skladka: string };
  };
  skladkaCalkowita: string;
  rataDo: string;
  kontoPlatnosci: string;
  kontakty: {
    szkody: string;
    assistance: string;
    medyczne: string;
    prawne: string;
  };
};

export default function UploadInsurancePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [extracted, setExtracted] = useState<Polisa | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("https://api.autoguardian.pl/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setOcrText(result.ocr_text);
      setExtracted(result.extracted);

      try {
        await fetch("https://api.autoguardian.pl/zapisz-polise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result.extracted),
        });
    } catch (err) {
      console.warn("Błąd zapisu polisy:", err);
    }
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
            <li><strong>Numer polisy:</strong> {extracted.numerPolisy}</li>
            <li><strong>Data zawarcia:</strong> {extracted.dataZawarcia}</li>
            <li><strong>Okres:</strong> {extracted.okres.od} - {extracted.okres.do}</li>
            <li><strong>Ubezpieczony:</strong> {extracted.ubezpieczajacy.imieNazwisko}</li>
            <li><strong>Marka pojazdu:</strong> {extracted.pojazd.marka}</li>
            <li><strong>Model:</strong> {extracted.pojazd.model}</li>
            <li><strong>VIN:</strong> {extracted.pojazd.vin}</li>
            <li><strong>OC:</strong> {extracted.zakres.oc.skladka} PLN ({extracted.zakres.oc.sumaOsoba} / {extracted.zakres.oc.sumaMienie})</li>
            <li><strong>AC:</strong> {extracted.zakres.ac.skladka} PLN (suma: {extracted.zakres.ac.suma})</li>
            <li><strong>Składka całkowita:</strong> {extracted.skladkaCalkowita} PLN</li>
            <li><strong>Płatność do:</strong> {extracted.rataDo}</li>
          </ul>
        </div>
      )}

      {ocrText && (
        <div className="mt-6 rounded p-4 overflow-auto bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
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
