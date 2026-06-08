import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/agents') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Rewrite all other routes to /
  return NextResponse.rewrite(new URL('/', request.url))
}

export const config = {
  matcher: ['/((?!_next|api|favicon|agents|.*\\..*).*)'],
}
