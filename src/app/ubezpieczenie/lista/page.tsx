"use client";

import { useEffect, useState } from "react";
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

export default function ListaPolis() {
  const [polisy, setPolisy] = useState<ExtractedData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("https://autoguardian-backend.onrender.com/pobierz-polisy");
      const data = await res.json();
      setPolisy(data);
    };
    fetchData();
  }, []);

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📁 Twoje zapisane polisy</h1>

      {polisy.length === 0 ? (
        <p>Brak zapisanych polis.</p>
      ) : (
        polisy.map((polisa, index) => (
          <div key={index} className="mb-4 p-4 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <h2 className="text-lg font-semibold mb-2">📄 {polisa.numerPolisy}</h2>
            <ul className="text-sm space-y-1">
              <li><strong>Ubezpieczyciel:</strong> {polisa.ubezpieczyciel}</li>
              <li><strong>Ubezpieczony:</strong> {polisa.ubezpieczony}</li>
              <li><strong>Pojazd:</strong> {polisa.pojazd}</li>
              <li><strong>Zakres:</strong> {polisa.zakres.join(", ")}</li>
              <li><strong>Okres:</strong> {polisa.okres.od} – {polisa.okres.do}</li>
              <li><strong>Składka:</strong> {polisa.skladka} zł</li>
              <li><strong>Suma ubezpieczenia:</strong> {polisa.sumaUbezpieczenia}</li>
              <li><strong>Udział własny:</strong> {polisa.udzialWlasny}</li>
              <li><strong>Amortyzacja:</strong> {polisa.amortyzacja}</li>
            </ul>
          </div>
        ))
      )}
      <Link href="/" className="text-blue-400 hover:underline mt-6 block text-sm">
        ← Wróć na stronę główną
      </Link>
    </main>
  );
}
