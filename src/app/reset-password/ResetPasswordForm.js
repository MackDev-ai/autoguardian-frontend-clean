"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Brak tokena resetującego hasło.");
    }
  }, [token]);

  async function handleReset(e) {
    e.preventDefault();
    if (!token) return;

    setStatus("loading");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setTimeout(() => router.push("/auth"), 2000);
      } else {
        setStatus("error");
        setError(data.detail || "Wystąpił błąd.");
      }
    } catch (_err) {
      setStatus("error");
      setError("Nie udało się połączyć z serwerem.");
    }
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ustaw nowe hasło</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}

      {status === "success" ? (
        <p className="text-green-600">Hasło zmienione! Przekierowuję...</p>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            placeholder="Nowe hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            {status === "loading" ? "Wysyłanie..." : "Zresetuj hasło"}
          </button>
        </form>
      )}
    </main>
  );
}
