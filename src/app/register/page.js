"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // npm install js-cookie

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  async function handleRegister(e) {
    e.preventDefault();
    setError(null);

    try {
      // najpierw rejestracja
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Wystąpił błąd podczas rejestracji");
        return;
      }

      // po rejestracji -> automatyczne logowanie
      const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        setError("Konto zostało utworzone, ale logowanie nie powiodło się");
        return;
      }

      // zapis tokena w cookie (ważne 1 dzień)
      Cookies.set("token", loginData.access_token, { expires: 1 });

      // przekierowanie na stronę główną
      router.push("/");
    } catch {
      setError("Błąd połączenia z serwerem");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <h2 className="text-2xl font-bold mb-4">Rejestracja</h2>

      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Hasło"
          className="w-full border p-2 rounded text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Zarejestruj się
        </button>
      </form>

      <p className="mt-4 text-sm">
        Masz już konto?{" "}
        <a href="/login" className="text-blue-500 underline">
          Zaloguj się
        </a>
      </p>
    </div>
  );
}
