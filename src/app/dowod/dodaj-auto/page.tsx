"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DodajAuto() {
  const router = useRouter();

  const [form, setForm] = useState({
    vin: "",
    rejestracja: "",
    marka: "",
    model: "",
    rok: "",
    pojemnosc: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("https://autoguardian-backend.onrender.com/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Błąd serwera");
      const result = await res.json();

      setForm({
        ...form,
        vin: result.extracted?.vin || "",
        rejestracja: result.extracted?.rejestracja || "",
      });
    } catch (err: any) {
      setError(err.message || "Nie udało się przetworzyć zdjęcia.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    const auta = JSON.parse(localStorage.getItem("auta") || "[]");
    auta.push(form);
    localStorage.setItem("auta", JSON.stringify(auta));
    router.push("/garaz");
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dodaj auto</h1>

      <div className="grid gap-4">
        <label>
          VIN:
          <input name="vin" value={form.vin} onChange={handleChange} className="w-full border px-2 py-1" />
        </label>
        <label>
          Rejestracja:
          <input name="rejestracja" value={form.rejestracja} onChange={handleChange} className="w-full border px-2 py-1" />
        </label>
        <label>
          Marka:
          <input name="marka" value={form.marka} onChange={handleChange} className="w-full border px-2 py-1" />
        </label>
        <label>
          Model:
          <input name="model" value={form.model} onChange={handleChange} className="w-full border px-2 py-1" />
        </label>
        <label>
          Rok:
          <input name="rok" value={form.rok} onChange={handleChange} className="w-full border px-2 py-1" />
        </label>
        <label>
          Pojemność (cm³):
          <input name="pojemnosc" value={form.pojemnosc} onChange={handleChange} className="w-full border px-2 py-1" />
        </label>

        <div>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button onClick={handleUpload} className="ml-2 bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
            {loading ? "Przetwarzanie..." : "OCR ze zdjęcia"}
          </button>
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">
          Zapisz auto
        </button>
      </div>
    </main>
  );
}
