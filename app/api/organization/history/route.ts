import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
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

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get("memberId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const searchQuery = searchParams.get("query")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    await dbConnect()

    // Build query
    const query: any = { organizationId: session.user.organizationId }

    if (memberId) {
      query.userId = memberId
    }

    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) query.timestamp.$gte = new Date(startDate)
      if (endDate) query.timestamp.$lte = new Date(endDate)
    }

    if (searchQuery) {
      query.query = { $regex: searchQuery, $options: "i" }
    }

    // Get total count
    const total = await SearchHistory.countDocuments(query)

    // Get paginated history
    const history = await SearchHistory.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return NextResponse.json({
      success: true,
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Fetch organization history error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch history" },
      { status: 500 }
    )
  }
}
