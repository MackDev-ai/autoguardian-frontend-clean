"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Auto = {
  vin: string;
  rejestracja: string;
};

export default function Garaz() {
  const [auta, setAuta] = useState<Auto[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("auta");
    if (saved) {
      setAuta(JSON.parse(saved));
    }
  }, []);

  const usunAuto = (index: number) => {
    const noweAuta = [...auta];
    noweAuta.splice(index, 1);
    setAuta(noweAuta);
    localStorage.setItem("auta", JSON.stringify(noweAuta));
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Garaż</h1>

      {auta.length === 0 ? (
        <p className="mb-4">Brak zapisanych aut.</p>
      ) : (
        <ul className="space-y-4">
          {auta.map((auto, index) => (
            <li key={index} className="bg-white rounded p-4 shadow">
              <p><strong>VIN:</strong> {auto.vin}</p>
              <p><strong>Rejestracja:</strong> {auto.rejestracja}</p>
              <button
                onClick={() => usunAuto(index)}
                className="mt-2 text-sm text-red-600 hover:underline"
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/dowod/dodaj-auto"
        className="inline-block mt-6 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Dodaj nowe auto
      </Link>
    </main>
  );
}
