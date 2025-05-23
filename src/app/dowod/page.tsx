"use client";

import { useState } from "react";

export default function DowodOCR() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<{ vin?: string; rejestracja?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("https://autoguardian-backend.onrender.com/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Błąd serwera");

      const result = await res.json();
      setData(result.extracted);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się przetworzyć zdjęcia.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📸 Dowód rejestracyjny (OCR)</h1>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Przetwarzanie..." : "Wyślij zdjęcie"}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {data && (
  <div className="mt-6 bg-gray-100 p-4 rounded">
    <h2 className="text-xl font-semibold mb-4">📄 Odczytane dane (edytowalne):</h2>

    <div className="mb-3">
      <label className="block font-medium mb-1">VIN:</label>
      <input
        type="text"
        value={data.vin || ""}
        onChange={(e) => setData({ ...data, vin: e.target.value })}
        className="w-full border px-3 py-2 rounded"
      />
    </div>

    <div className="mb-3">
      <label className="block font-medium mb-1">Rejestracja:</label>
      <input
        type="text"
        value={data.rejestracja || ""}
        onChange={(e) => setData({ ...data, rejestracja: e.target.value })}
        className="w-full border px-3 py-2 rounded"
      />
    </div>

    {/* 🔒 Na przyszłość – przycisk zapisania */}
    {/* 
    <button
      onClick={() => saveToDatabase(data)}
      className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
    >
      Zapisz dane
    </button> 
    */}
  </div>
)}
    </main>
  );
}
