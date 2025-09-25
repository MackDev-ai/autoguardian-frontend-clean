"use client";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  function handleLogout() {
    Cookies.remove("token");
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
      </div>
    </nav>
  );
}
