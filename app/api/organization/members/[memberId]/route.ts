import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import SearchHistory from "@/lib/models/SearchHistory"
import { requireOrgAdmin } from "@/lib/auth-helpers"

export async function GET(
  req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await requireOrgAdmin()

    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: "Not part of an organization" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Verify the member belongs to this organization
    const member = await User.findOne({
      _id: params.memberId,
      organizationId: session.user.organizationId,
    })

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    // Get member stats
    const totalSearches = await SearchHistory.countDocuments({
      userId: params.memberId,
      organizationId: session.user.organizationId,
    })

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentSearches = await SearchHistory.countDocuments({
      userId: params.memberId,
      organizationId: session.user.organizationId,
      timestamp: { $gte: sevenDaysAgo },
    })

    // Get last active date
    const lastSearch = await SearchHistory.findOne({
      userId: params.memberId,
      organizationId: session.user.organizationId,
    }).sort({ timestamp: -1 })

    // Get recent history
    const recentHistory = await SearchHistory.find({
      userId: params.memberId,
      organizationId: session.user.organizationId,
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .select("query timestamp status")

    return NextResponse.json({
      success: true,
      member: {
        userId: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        joinedAt: member.joinedAt,
        image: member.image,
        stats: {
          totalSearches,
          recentSearches,
          lastActive: lastSearch?.timestamp,
        },
        recentHistory,
      },
    })
  } catch (error: any) {
    console.error("Fetch member profile error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch member profile" },
      { status: 500 }
    )
  }
}
