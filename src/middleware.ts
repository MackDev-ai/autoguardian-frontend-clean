import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/me", "/garage", "/polisy", "/upload-pdf"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("ag_token")?.value;

  const url = req.nextUrl.clone();
  const pathname = req.nextUrl.pathname;

  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path));

  if (isProtected && !token) {
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/me", "/garage", "/polisy", "/upload-pdf"],
};
