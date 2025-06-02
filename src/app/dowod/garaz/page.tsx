import { useEffect, useState } from "react";
import Link from "next/link";

export default function Garaz() {
  const [auta, setAuta] = useState<any[]>([]);

  useEffect(() => {
    const zapisane = JSON.parse(localStorage.getItem("auta") || "[]");
    setAuta(zapisane);
  }, []);

  const handleDelete = (index: number) => {
    const noweAuta = [...auta];
    noweAuta.splice(index, 1);
    localStorage.setItem("auta", JSON.stringify(noweAuta));
    setAuta(noweAuta);
  };

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🚗 Garaż</h1>

      {auta.length === 0 ? (
        <p>Brak zapisanych pojazdów.</p>
      ) : (
        <div className="grid gap-4">
          {auta.map((auto, i) => (
            <div key={i} className="border p-4 rounded bg-gray-100">
              <p><strong>VIN:</strong> {auto.vin}</p>
              <p><strong>Rejestracja:</strong> {auto.rejestracja}</p>
              <p><strong>Marka:</strong> {auto.marka}</p>
              <p><strong>Model:</strong> {auto.model}</p>
              <p><strong>Rok:</strong> {auto.rok}</p>
              <p><strong>Pojemność:</strong> {auto.pojemnosc} cm³</p>
              <button
                onClick={() => handleDelete(i)}
                className="mt-2 bg-red-600 text-white px-3 py-1 rounded"
              >
                Usuń
              </button>
            </div>
          ))}
        </div>
      )}

      <Link href="/dodaj-auto">
        <button className="mt-6 bg-blue-600 text-white px-4 py-2 rounded">
          ➕ Dodaj kolejne auto
        </button>
      </Link>
    </main>
  );
}
