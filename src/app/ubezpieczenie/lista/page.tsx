"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Polisa = {
  numerPolisy: string;
  numerSprawy: string;
  dataZawarcia: string;
  okres: { od: string; do: string };
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

export default function ListaPolis() {
  const [polisy, setPolisy] = useState<Polisa[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("https://api.autoguardian.pl/pobierz-polisy");
      const data = await res.json();
      setPolisy(Array.isArray(data) ? data : []);
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
              <li><strong>Data zawarcia:</strong> {polisa.dataZawarcia}</li>
              <li><strong>Ubezpieczyciel:</strong> {polisa.ubezpieczyciel}</li>
              <li><strong>Ubezpieczony:</strong> {polisa.ubezpieczajacy.imieNazwisko}</li>
              <li><strong>Marka pojazdu:</strong> {polisa.pojazd.marka}</li>
              <li><strong>Model:</strong> {polisa.pojazd.model}</li>
              <li><strong>Numer rejestracyjny:</strong> {polisa.pojazd.nrRejestracyjny}</li>
              <li><strong>VIN:</strong> {polisa.pojazd.vin}</li>
              <li><strong>Okres:</strong> {polisa.okres.od} – {polisa.okres.do}</li>
              <li><strong>Zakres OC:</strong> {polisa.zakres.oc.sumaOsoba} / {polisa.zakres.oc.sumaMienie} – {polisa.zakres.oc.skladka} PLN</li>
              <li><strong>Zakres AC:</strong> {polisa.zakres.ac.suma} – {polisa.zakres.ac.skladka} PLN</li>
              <li><strong>Składka całkowita:</strong> {polisa.skladkaCalkowita} PLN</li>
              <li><strong>Płatność do:</strong> {polisa.rataDo}</li>
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
