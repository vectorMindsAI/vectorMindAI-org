import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Organization from "@/lib/models/Organization"
import { requireOrgAdmin } from "@/lib/auth-helpers"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const session = await requireOrgAdmin()
    const { email, expiresInDays = 7 } = await req.json()

    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: "Not part of an organization" },
        { status: 400 }
      )
    }

    await dbConnect()

    const organization = await Organization.findById(session.user.organizationId)
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Generate unique invite code
    const inviteCode = crypto.randomBytes(16).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    // Add invite to organization
    organization.invites.push({
      code: inviteCode,
      email: email || undefined,
      role: "member",
      createdBy: session.user.id,
      expiresAt,
      used: false,
    } as any)

    await organization.save()

    const inviteLink = `${process.env.NEXTAUTH_URL}/auth/join/${inviteCode}`

    return NextResponse.json({
      success: true,
      invite: {
        code: inviteCode,
        link: inviteLink,
        email,
        expiresAt,
      },
    })
  } catch (error: any) {
    console.error("Invite creation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create invite" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireOrgAdmin()

    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: "Not part of an organization" },
        { status: 400 }
      )
    }

    await dbConnect()

    const organization = await Organization.findById(session.user.organizationId)
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Filter out expired and used invites
    const activeInvites = organization.invites.filter(
      (invite: any) => !invite.used && new Date(invite.expiresAt) > new Date()
    )

    return NextResponse.json({
      success: true,
      invites: activeInvites.map((invite: any) => ({
        code: invite.code,
        email: invite.email,
        expiresAt: invite.expiresAt,
        createdBy: invite.createdBy,
      })),
    })
  } catch (error: any) {
    console.error("Fetch invites error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch invites" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireOrgAdmin()
    const { code } = await req.json()

    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: "Not part of an organization" },
        { status: 400 }
      )
    }

    await dbConnect()

    const organization = await Organization.findById(session.user.organizationId)
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Remove the invite
    organization.invites = organization.invites.filter(
      (invite: any) => invite.code !== code
    )

    await organization.save()

    return NextResponse.json({
      success: true,
      message: "Invite deleted successfully",
    })
  } catch (error: any) {
    console.error("Delete invite error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete invite" },
      { status: 500 }
    )
  }
}
