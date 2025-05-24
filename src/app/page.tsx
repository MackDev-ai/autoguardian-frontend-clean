import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6 max-w-xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">🚗 AutoGuardian</h1>
      <p className="mb-6">Aplikacja do rozpoznawania danych z dowodu rejestracyjnego</p>
      <Link href="/dowod">
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Przejdź do OCR
        </button>
      </Link>
    </main>
  );
}
