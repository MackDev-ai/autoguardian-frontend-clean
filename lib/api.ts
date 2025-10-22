export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

// Handler do obsługi 401 (unauthorized)
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

// Typy opcji i wyników zapytań
export interface TryFetchOptions extends RequestInit {
  paths: string | string[];
}

export interface TryFetchResult<T> {
  ok: boolean;
  data: T;
  status: number;
  path?: string;
}

// Główny wrapper fetch z obsługą wielu endpointów i błędów
export async function tryFetch<T = unknown>(
  options: TryFetchOptions
): Promise<TryFetchResult<T>> {
  const { paths, ...rest } = options;
  const list = Array.isArray(paths) ? paths : [paths];
  let lastErr: TryFetchResult<T> = {
    ok: false,
    data: {} as T,
    status: 0,
  };

  for (const p of list) {
    try {
      const res = await fetch(`${API_BASE}${p}`, {
        ...rest,
        headers: {
          Accept: 'application/json',
          ...(rest.headers || {}),
        },
        credentials: 'include',
      });

      const data: T = await res.json().catch(() => ({} as T));

      if (res.status === 401 && onUnauthorized) {
        try {
          onUnauthorized();
        } catch {
          // Ignoruj błędy handlera
        }
      }

      if (res.ok) {
        return { ok: true, data, status: res.status, path: p };
      }

      lastErr = { ok: false, data, status: res.status, path: p };
    } catch (e) {
      lastErr = {
        ok: false,
        data: { detail: String(e) } as T,
        status: 0,
        path: p,
      };
    }
  }

  return lastErr;
}

// Lista endpointów API
export const ENDPOINTS = {
  login: ['/auth/login', '/login'],
  register: ['/auth/register', '/register'],
  me: '/me',
  polisyList: ['/pobierz-polisy', '/polisy'],
  uploadPdf: '/upload-pdf',
  zapiszPolise: ['/zapisz-polise', '/polisy'],
};

// Prosty check zdrowia backendu
export async function health(): Promise<TryFetchResult<Record<string, unknown>>> {
  return tryFetch<Record<string, unknown>>({ paths: ['/health', '/'] });
}
