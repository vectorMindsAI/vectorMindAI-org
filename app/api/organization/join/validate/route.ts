import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Organization from "@/lib/models/Organization"
import User from "@/lib/models/User"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json({ error: "Invite code required" }, { status: 400 })
    }

    await dbConnect()

    const organization = await Organization.findOne({
      "invites.code": code,
    })

    if (!organization) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 })
    }

    const invite = organization.invites.find((inv: any) => inv.code === code)

    if (!invite || invite.used) {
      return NextResponse.json({ error: "Invite already used" }, { status: 400 })
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      invite: {
        code: invite.code,
        organizationName: organization.name,
        expiresAt: invite.expiresAt,
      },
    })
  } catch (error: any) {
    console.error("Validate invite error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to validate invite" },
      { status: 500 }
    )
  }
}
