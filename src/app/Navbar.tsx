"use client";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    setIsLoggedIn(!!token); // true jeśli token istnieje
  }, []);

  function handleLogout() {
    Cookies.remove("token");
    setIsLoggedIn(false);
    router.push("/login");
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
        {isLoggedIn ? (
          <>
            <button
              onClick={() => router.push("/polisy")}
              className="hover:underline"
            >
              Polisy
            </button>
            <button
              onClick={() => router.push("/me")}
              className="hover:underline"
            >
              Profil
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
            >
              Wyloguj się
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push("/login")}
              className="hover:underline"
            >
              Zaloguj się
            </button>
            <button
              onClick={() => router.push("/register")}
              className="hover:underline"
            >
              Rejestracja
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
