import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Organization from "@/lib/models/Organization"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Search organizations by name (case-insensitive)
    const organizations = await Organization.find({
      name: { $regex: query, $options: "i" },
      isActive: true,
    })
      .select("name createdAt members")
      .limit(10)
      .lean()

    const results = organizations.map((org) => ({
      _id: org._id,
      name: org.name,
      memberCount: org.members?.length || 0,
      createdAt: org.createdAt,
    }))

    return NextResponse.json({
      success: true,
      organizations: results,
    })
  } catch (error: any) {
    console.error("Search organizations error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to search organizations" },
      { status: 500 }
    )
  }
}
