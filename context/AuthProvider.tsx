"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthCtx = { token: string | null; setToken: (t: string | null) => void; isAuthed: boolean; };
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => { const t = localStorage.getItem("ag_token"); if (t) setTokenState(t); }, []);

  const setToken = (t: string | null) => {
    if (typeof window !== "undefined") {
      if (t) {
        localStorage.setItem("ag_token", t);
        document.cookie = `ag_token=${t}; path=/`;
      } else {
        localStorage.removeItem("ag_token");
        document.cookie = "ag_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }
    setTokenState(t);
  };

  const value = useMemo(() => ({ token, setToken, isAuthed: !!token }), [token]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
export function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
