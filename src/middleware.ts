// src/middleware.ts (tylko jeśli naprawdę chcesz chronić ścieżki)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const publicPaths = ["/", "/login", "/register"];
  if (!token && !publicPaths.includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}
