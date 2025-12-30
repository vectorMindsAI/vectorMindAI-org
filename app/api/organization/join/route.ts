import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Organization from "@/lib/models/Organization"
import User from "@/lib/models/User"
import { requireAuth } from "@/lib/auth-helpers"

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: "Invite code required" }, { status: 400 })
    }

    await dbConnect()

    // Check if user already in an organization
    const user = await User.findById(session.user.id)
    if (user?.organizationId) {
      return NextResponse.json(
        { error: "You are already a member of an organization" },
        { status: 400 }
      )
    }

    // Find organization with this invite
    const organization = await Organization.findOne({
      "invites.code": code,
    })

    if (!organization) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 })
    }

    const inviteIndex = organization.invites.findIndex((inv: any) => inv.code === code)

    if (inviteIndex === -1) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    const invite = organization.invites[inviteIndex]

    if (invite.used) {
      return NextResponse.json({ error: "Invite already used" }, { status: 400 })
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 })
    }

    // Check email match if invite has specific email
    if (invite.email && invite.email !== session.user.email) {
      return NextResponse.json(
        { error: "This invite is for a different email address" },
        { status: 403 }
      )
    }

    // Add user to organization
    organization.members.push({
      userId: session.user.id,
      role: "member",
      joinedAt: new Date(),
      invitedBy: invite.createdBy,
    } as any)

    // Mark invite as used
    organization.invites[inviteIndex].used = true
    organization.invites[inviteIndex].usedBy = session.user.id
    organization.invites[inviteIndex].usedAt = new Date()

    await organization.save()

    // Update user
    await User.findByIdAndUpdate(session.user.id, {
      role: "member",
      organizationId: organization._id.toString(),
      joinedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        role: "member",
      },
    })
  } catch (error: any) {
    console.error("Join organization error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to join organization" },
      { status: 500 }
    )
  }
}
