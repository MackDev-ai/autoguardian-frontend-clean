"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function Me() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      setError("Brak tokena – zaloguj się ponownie");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.detail) {
          setError('Błąd: ', data.detail);
        } else {
          setUser(data);
        }
      })
      .catch(() => setError("Błąd połączenia z API"));
  }, []);

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Mój profil</h1>
      {error && <p className="text-red-600">{error}</p>}
      {user && (
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      )}
    </main>
  );
}
