import { NextRequest, NextResponse } from "next/server";

/**
 * Redirect legacy routes to their consolidated destinations.
 */
const redirects: Record<string, string> = {
  "/dapp/nfc": "/dapp/identity",
  "/dapp/qr": "/dapp/identity",
};

export function middleware(request: NextRequest) {
  const target = redirects[request.nextUrl.pathname];
  if (target) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dapp/nfc", "/dapp/qr"],
};
