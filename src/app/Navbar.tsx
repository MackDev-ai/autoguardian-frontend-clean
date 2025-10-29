"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthProvider"; // popraw ścieżkę jeśli inna

export default function Navbar() {
  const router = useRouter();
  const { isAuthed, setToken, token } = useAuth();
  console.log("Navbar → isAuthed:", isAuthed, "token:", token);

  function handleLogout() {
    setToken(null); // Usuwa token z localStorage i czyści kontekst
    router.push("/auth"); // zakładam, że masz łączoną stronę logowania/rejestracji
  }

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-gray-900 text-white">
      <h1
        className="text-xl font-bold cursor-pointer"
        onClick={() => router.push("/")}
      >
        🚗 AutoGuardian
      </h1>
      <div className="space-x-4">
        {isAuthed ? (
          <>
            <button onClick={() => router.push("/polisy")} className="hover:underline">Polisy</button>
            <button onClick={() => router.push("/me")} className="hover:underline">Profil</button>
            <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">Wyloguj się</button>
          </>
        ) : (
          <>
            <button onClick={() => router.push("/auth")} className="hover:underline">Zaloguj się</button>
            <button onClick={() => router.push("/auth")} className="hover:underline">Rejestracja</button>
          </>
        )}
      </div>
    </nav>
  );
}
