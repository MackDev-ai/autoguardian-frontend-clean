import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (p === "/login" || p === "/register") {
    return NextResponse.redirect(new URL("/", req.url));
  }
}
export const config = { matcher: ["/login", "/register"] };
