import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hasAccess = request.cookies.get('aetheryx_access')?.value === '1'

  if (!hasAccess) {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'aetheryx.ai'
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    return NextResponse.redirect(`${proto}://${host}/?access=required`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
