import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Organization from "@/lib/models/Organization"
import User from "@/lib/models/User"
import { requireOrgMember, isOrgAdmin } from "@/lib/auth-helpers"

export async function GET(req: NextRequest) {
  try {
    const session = await requireOrgMember()

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

    // Get member details
    const memberIds = organization.members.map((m: any) => m.userId)
    const users = await User.find({ _id: { $in: memberIds } }).select(
      "name email image role createdAt"
    )

    const membersWithDetails = organization.members.map((member: any) => {
      const user = users.find((u) => u._id.toString() === member.userId)
      return {
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        invitedBy: member.invitedBy,
        name: user?.name,
        email: user?.email,
        image: user?.image,
      }
    })

    return NextResponse.json({
      success: true,
      members: membersWithDetails,
    })
  } catch (error: any) {
    console.error("Fetch members error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch members" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireOrgMember()
    const { userId } = await req.json()

    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: "Not part of an organization" },
        { status: 400 }
      )
    }

    // Only org-admin can remove members
    if (!isOrgAdmin(session)) {
      return NextResponse.json(
        { error: "Only organization admins can remove members" },
        { status: 403 }
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

    // Cannot remove the creator
    if (userId === organization.createdBy) {
      return NextResponse.json(
        { error: "Cannot remove organization creator" },
        { status: 400 }
      )
    }

    // Remove member from organization
    organization.members = organization.members.filter(
      (member: any) => member.userId !== userId
    )

    await organization.save()

    // Update user to individual
    await User.findByIdAndUpdate(userId, {
      role: "individual",
      organizationId: null,
      joinedAt: null,
    })

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    })
  } catch (error: any) {
    console.error("Remove member error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to remove member" },
      { status: 500 }
    )
  }
}
