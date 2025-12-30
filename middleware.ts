import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Skip middleware - handle redirects on client side
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
}
