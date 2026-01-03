import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import arcjet, { slidingWindow } from "@arcjet/next"

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    slidingWindow({
      mode: "LIVE",
      interval: "60s",
      max: 50,
    }),
  ],
})

export async function middleware(request: NextRequest) {
  const decision = await aj.protect(request)

  if (decision.isDenied()) {
    return NextResponse.json({ error: "Too Many Requests", reason: decision.reason }, { status: 429 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/api/:path*"],
}
