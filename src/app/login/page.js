"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // npm install js-cookie

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleLogin(e) {
  e.preventDefault();
  setError(null);

  // 1) twardy check ENV
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    setError("Błąd konfiguracji frontu: brak NEXT_PUBLIC_API_URL");
    return;
  }

  const url = `${baseUrl}/auth/login`;

  try {
    // 2) BACKEND najpewniej oczekuje form-urlencoded (OAuth2PasswordRequestForm)
    const body = new URLSearchParams({ username: email, password });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    // 3) Czytelna diagnostyka
    let payloadText = "";
    try { payloadText = await res.text(); } catch {}
    let payload;
    try { payload = JSON.parse(payloadText); } catch { payload = null; }

    if (!res.ok) {
      // krótkie, ale precyzyjne komunikaty
      if (res.status === 401) return setError("Nieprawidłowy email lub hasło.");
      if (res.status === 404) return setError("Błąd konfiguracji: endpoint /auth/login nie istnieje (404).");
      if (res.status >= 500) {
        return setError(
          `Błąd serwera (${res.status}). URL: ${url}. Odpowiedź: ${payload?.detail || payloadText || "brak"}`
        );
      }
      return setError(payload?.detail || `Błąd logowania (${res.status}).`);
    }

    // 4) Sukces — token
    const data = payload || {};
    if (!data.access_token) {
      return setError("Brak access_token w odpowiedzi serwera.");
    }

    // 5) Cookie z tokenem
    Cookies.set("token", data.access_token, {
      expires: 1,
      sameSite: "strict",
      secure: true,
      path: "/",
    });

    router.push("/");
  } catch (err) {
    setError("Błąd połączenia (CORS/sieć). Sprawdź, czy API jest dostępne.");
  }
}


  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Logowanie</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded text-black"
        />
        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border px-3 py-2 rounded text-black"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Zaloguj się
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>

      {/* Link do rejestracji */}
      <p className="text-sm mt-4 text-center">
        Nie masz konta?{" "}
        <a href="/register" className="text-blue-400 hover:underline">
          Zarejestruj się
        </a>
      </p>
    </main>
  );
}
