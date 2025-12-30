import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Organization from "@/lib/models/Organization"
import User from "@/lib/models/User"
import { requireAuth } from "@/lib/auth-helpers"

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { name } = await req.json()

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Organization name must be at least 2 characters" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Check if user already has an organization
    const user = await User.findById(session.user.id)
    if (user?.organizationId) {
      return NextResponse.json(
        { error: "User already belongs to an organization" },
        { status: 400 }
      )
    }

    // Create organization
    const organization = await Organization.create({
      name: name.trim(),
      createdBy: session.user.id,
      members: [
        {
          userId: session.user.id,
          role: "org-admin",
          joinedAt: new Date(),
        },
      ],
      settings: {
        allowMemberInvites: false,
        requireApproval: false,
      },
      isActive: true,
    })

    // Update user to be org-admin
    await User.findByIdAndUpdate(session.user.id, {
      role: "org-admin",
      organizationId: organization._id.toString(),
      joinedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        role: "org-admin",
      },
    })
  } catch (error: any) {
    console.error("Organization creation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create organization" },
      { status: 500 }
    )
  }
}
