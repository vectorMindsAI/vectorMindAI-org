import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Organization from "@/lib/models/Organization"
import User from "@/lib/models/User"
import SearchHistory from "@/lib/models/SearchHistory"
import { requireOrgAdmin } from "@/lib/auth-helpers"

export async function DELETE(req: NextRequest) {
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

    // Check if user is the creator
    if (organization.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: "Only the organization creator can delete it" },
        { status: 403 }
      )
    }

    // Update all members to individual
    const memberIds = organization.members.map((m: any) => m.userId)
    await User.updateMany(
      { _id: { $in: memberIds } },
      {
        $set: { role: "individual", organizationId: null, joinedAt: null },
      }
    )

    // Optionally: Delete or anonymize search history
    // For now, we'll just remove the organization reference
    await SearchHistory.updateMany(
      { organizationId: session.user.organizationId },
      { $unset: { organizationId: "" } }
    )

    // Delete the organization
    await Organization.findByIdAndDelete(session.user.organizationId)

    return NextResponse.json({
      success: true,
      message: "Organization deleted successfully",
    })
  } catch (error: any) {
    console.error("Delete organization error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete organization" },
      { status: 500 }
    )
  }
}
