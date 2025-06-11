"use client";

import { useState } from "react";

export default function UploadInsurancePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [extracted, setExtracted] = useState<any>(null);

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
        <div className="mt-6 bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Dane z polisy:</h2>
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(extracted, null, 2)}</pre>
        </div>
      )}

      {ocrText && (
        <div className="mt-6">
          <h2 className="text-lg font-medium">Zawartość PDF (OCR):</h2>
          <pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap">{ocrText}</pre>
        </div>
      )}
    </main>
  );
}
