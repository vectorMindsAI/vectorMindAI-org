import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Organization from "@/lib/models/Organization"
import { requireAuth } from "@/lib/auth-helpers"

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { organizationId } = await req.json()

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      )
    }

    // Check if user already belongs to an organization
    if ((session.user as any).organizationId) {
      return NextResponse.json(
        { error: "You already belong to an organization" },
        { status: 400 }
      )
    }

    await dbConnect()

    const organization = await Organization.findById(organizationId)
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Check if user already has a pending or approved request
    const existingRequest = organization.joinRequests?.find(
      (req: any) =>
        req.userId === session.user.id &&
        (req.status === "pending" || req.status === "approved")
    )

    if (existingRequest) {
      return NextResponse.json(
        { error: `You already have a ${existingRequest.status} request for this organization` },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const isMember = organization.members.some(
      (member: any) => member.userId === session.user.id
    )

    if (isMember) {
      return NextResponse.json(
        { error: "You are already a member of this organization" },
        { status: 400 }
      )
    }

    // Add join request
    organization.joinRequests = organization.joinRequests || []
    organization.joinRequests.push({
      userId: session.user.id,
      userName: session.user.name || "Unknown",
      userEmail: session.user.email || "",
      userImage: (session.user as any).image,
      status: "pending",
      requestedAt: new Date(),
    } as any)

    await organization.save()

    return NextResponse.json({
      success: true,
      message: "Join request sent successfully",
    })
  } catch (error: any) {
    console.error("Join request error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send join request" },
      { status: 500 }
    )
  }
}

// Get pending join requests (for org admins)
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()

    if (!session.user || !(session.user as any).organizationId) {
      return NextResponse.json(
        { error: "Not part of an organization" },
        { status: 400 }
      )
    }

    await dbConnect()

    const organization = await Organization.findById(
      (session.user as any).organizationId
    )

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Filter pending requests
    const pendingRequests = organization.joinRequests?.filter(
      (req: any) => req.status === "pending"
    ) || []

    return NextResponse.json({
      success: true,
      requests: pendingRequests,
    })
  } catch (error: any) {
    console.error("Get join requests error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch join requests" },
      { status: 500 }
    )
  }
}
