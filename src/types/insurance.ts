export type InsuranceData = {
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
  definicje?: Record<string, string>;
};

export const Definitions: Record<string, string> = {
  "udział własny":
    "Kwota, którą klient musi pokryć z własnej kieszeni w razie szkody. Jeśli udział własny to 1000 zł, a szkoda wynosi 5000 zł — ubezpieczyciel wypłaci tylko 4000 zł.",
  amortyzacja:
    "Obniżenie wartości części pojazdu ze względu na jego wiek. Może zmniejszyć kwotę wypłaty w przypadku szkody.",
  NNW:
    "Ubezpieczenie Następstw Nieszczęśliwych Wypadków — chroni kierowcę i pasażerów w razie wypadku.",
  OC:
    "Odpowiedzialność Cywilna — obowiązkowe ubezpieczenie pokrywające szkody wyrządzone innym uczestnikom ruchu.",
  AC:
    "Autocasco — dobrowolne ubezpieczenie pokrywające szkody w Twoim pojeździe, np. po kolizji lub kradzieży.",
  assistance:
    "Pomoc drogowa: holowanie, naprawa na miejscu, auto zastępcze, itd.",
};
