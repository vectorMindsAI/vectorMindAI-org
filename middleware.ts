import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import arcjet, { slidingWindow, tokenBucket } from "@arcjet/next"

// General rate limit: 50 req / 60s
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

// Research-specific rate limit: 5 req / 60s
const ajResearch = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    tokenBucket({
      mode: "LIVE",
      refillRate: 5,
      interval: "60s",
      capacity: 5,
    }),
  ],
})

export async function middleware(request: NextRequest) {
  // Skip middleware for Inngest webhook endpoint
  if (request.nextUrl.pathname.startsWith("/api/inngest")) {
    return NextResponse.next()
  }

  let decision;

  if (request.nextUrl.pathname.startsWith("/api/research")) {
    decision = await ajResearch.protect(request, { requested: 1 })
  } else {
    decision = await aj.protect(request)
  }

  if (decision.isDenied()) {
    return NextResponse.json(
      { error: "Too Many Requests", reason: decision.reason },
      { status: 429 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/api/:path*"],
}
