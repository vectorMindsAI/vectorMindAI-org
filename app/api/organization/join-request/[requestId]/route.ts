import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Organization from "@/lib/models/Organization"
import User from "@/lib/models/User"
import { requireOrgAdmin } from "@/lib/auth-helpers"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await requireOrgAdmin()
    const { action } = await req.json() // "approve" or "reject"
    const { requestId } = await params

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      )
    }

    if (!(session.user as any).organizationId) {
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

    // Find the join request
    const requestIndex = organization.joinRequests?.findIndex(
      (req: any) => req.userId === requestId && req.status === "pending"
    )

    if (requestIndex === -1 || requestIndex === undefined) {
      return NextResponse.json(
        { error: "Join request not found or already processed" },
        { status: 404 }
      )
    }

    const joinRequest = organization.joinRequests[requestIndex]

    if (action === "approve") {
      // Add user to organization members
      organization.members.push({
        userId: joinRequest.userId,
        role: "member",
        joinedAt: new Date(),
        invitedBy: session.user.id,
      } as any)

      // Update user's organization and role
      await User.findByIdAndUpdate(joinRequest.userId, {
        role: "member",
        organizationId: organization._id,
        joinedAt: new Date(),
      })

      // Update request status
      organization.joinRequests[requestIndex].status = "approved"
      organization.joinRequests[requestIndex].respondedAt = new Date()
      organization.joinRequests[requestIndex].respondedBy = session.user.id
    } else {
      // Reject the request
      organization.joinRequests[requestIndex].status = "rejected"
      organization.joinRequests[requestIndex].respondedAt = new Date()
      organization.joinRequests[requestIndex].respondedBy = session.user.id
    }

    await organization.save()

    return NextResponse.json({
      success: true,
      message: `Join request ${action === "approve" ? "approved" : "rejected"} successfully`,
    })
  } catch (error: any) {
    console.error("Process join request error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process join request" },
      { status: 500 }
    )
  }
}
