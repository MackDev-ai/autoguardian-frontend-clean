import { NextResponse } from "next/server";

// middleware działa przy każdym request
export function middleware(request) {
  const token = request.cookies.get("token")?.value;

  // jeśli brak tokena i próbujemy wejść gdzieś poza login/register
  if (
    !token &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/register")
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// konfiguracja – middleware działa dla wszystkich ścieżek poza assetami
export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
