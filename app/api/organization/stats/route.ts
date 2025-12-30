import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Organization from "@/lib/models/Organization"
import SearchHistory from "@/lib/models/SearchHistory"
import { requireOrgAdmin } from "@/lib/auth-helpers"

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

    // Get total searches
    const totalSearches = await SearchHistory.countDocuments({
      organizationId: session.user.organizationId,
    })

    // Get active members (members who searched in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentSearches = await SearchHistory.distinct("userId", {
      organizationId: session.user.organizationId,
      timestamp: { $gte: sevenDaysAgo },
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalMembers: organization.members.length,
        totalSearches,
        activeMembers: recentSearches.length,
      },
    })
  } catch (error: any) {
    console.error("Fetch organization stats error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
