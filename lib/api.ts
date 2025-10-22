// lib/api.ts
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.autoguardian.pl";

/** Globalny handler 401 (np. do wylogowania) */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

type TryFetchOpts = RequestInit & { paths: string | string[] };

export async function tryFetch<T = any>({
  paths,
  ...options
}: TryFetchOpts): Promise<{
  ok: boolean;
  data: T | any;
  status: number;
  path?: string;
}> {
  const list = Array.isArray(paths) ? paths : [paths];
  let lastErr: any = null;

  for (const p of list) {
    try {
      const res = await fetch(API_BASE + p, {
        ...options,
        headers: {
          Accept: "application/json",
          ...(options.headers || {}),
        },
        credentials: "include",
      });

      // spróbuj sparsować JSON; jeśli się nie da, daj pusty obiekt
      const data = await res.json().catch(() => ({}));

      if (res.status === 401 && onUnauthorized) {
        // odpal globalny handler 401
        try { onUnauthorized(); } catch {}
      }

      if (res.ok) return { ok: true, data, status: res.status, path: p };
      lastErr = { ok: false, data, status: res.status, path: p };
    } catch (e: any) {
      lastErr = {
        ok: false,
        data: { detail: String(e) },
        status: 0,
        path: p,
      };
    }
  }
  return lastErr;
}

export const ENDPOINTS = {
  login: ["/auth/login", "/login"],
  register: ["/auth/register", "/register"],
  me: "/me",
  polisyList: ["/pobierz-polisy", "/polisy"],
  uploadPdf: "/upload-pdf",
  zapiszPolise: ["/zapisz-polise", "/polisy"],
};
