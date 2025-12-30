import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Organization from "@/lib/models/Organization"
import SearchHistory from "@/lib/models/SearchHistory"
import User from "@/lib/models/User"
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

    // Get active members (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentSearches = await SearchHistory.distinct("userId", {
      organizationId: session.user.organizationId,
      timestamp: { $gte: sevenDaysAgo },
    })

    // Get top members by search count
    const searchCounts = await SearchHistory.aggregate([
      { $match: { organizationId: session.user.organizationId } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ])

    const memberIds = searchCounts.map((item) => item._id)
    const users = await User.find({ _id: { $in: memberIds } }).select("name email")

    const topMembers = searchCounts.map((item) => {
      const user = users.find((u) => u._id.toString() === item._id)
      return {
        userId: item._id,
        name: user?.name || "Unknown",
        email: user?.email || "",
        searchCount: item.count,
      }
    })

    // Get recent activity (last 7 days)
    const recentActivity = await SearchHistory.aggregate([
      {
        $match: {
          organizationId: session.user.organizationId,
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const formattedActivity = recentActivity.map((item) => ({
      date: item._id,
      count: item.count,
    }))

    return NextResponse.json({
      success: true,
      analytics: {
        totalSearches,
        activeMembers: recentSearches.length,
        topMembers,
        recentActivity: formattedActivity,
      },
    })
  } catch (error: any) {
    console.error("Fetch analytics error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
