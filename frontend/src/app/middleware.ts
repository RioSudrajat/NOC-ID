import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Legacy NOC ID redirects — deprecated portals
  if (pathname.startsWith('/dapp')) {
    return NextResponse.redirect(new URL('/', request.url), { status: 308 })
  }

  if (pathname.startsWith('/enterprise')) {
    return NextResponse.redirect(new URL('/rwa/operator', request.url), { status: 308 })
  }

  // Old dapp NFC/QR routes
  if (pathname === '/dapp/nfc' || pathname === '/dapp/qr') {
    return NextResponse.redirect(new URL('/', request.url), { status: 308 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dapp/:path*', '/enterprise/:path*', '/dapp/nfc', '/dapp/qr'],
}
