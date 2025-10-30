export async function fetchWithRefresh(input: RequestInfo, init?: RequestInit): Promise<Response> {
  let res = await fetch(input, init);

  if (res.status === 401) {
    // Spróbuj odświeżyć token
    const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      // Ponów poprzednie zapytanie
      res = await fetch(input, init);
    } else {
      // Przekieruj do logowania
      window.location.href = "/auth";
    }
  }

  return res;
}
