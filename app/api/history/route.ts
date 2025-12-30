import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/mongodb"
import SearchHistory from "@/lib/models/SearchHistory"
import User from "@/lib/models/User"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { query, criteria, results, model, fallbackModel, status } = body

    if (!query || !results) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculate size in KB
    const jsonString = JSON.stringify(results)
    const sizeKB = Buffer.byteLength(jsonString, "utf8") / 1024

    // Check if size is within MongoDB limit (16MB)
    if (sizeKB > 15 * 1024) {
      return NextResponse.json({ error: "Response too large to store (>15MB)" }, { status: 413 })
    }

    await dbConnect()
    
    // Get user details for organization context
    const user = await User.findById(session.user.id)

    const history = await SearchHistory.create({
      userId: session.user.id,
      organizationId: (session.user as any).organizationId || user?.organizationId,
      userName: session.user.name,
      userEmail: session.user.email,
      query,
      criteria: criteria || [],
      results,
      model: model || "unknown",
      fallbackModel,
      status: status || "success",
      sizeKB: parseFloat(sizeKB.toFixed(2)),
    })

    return NextResponse.json({ success: true, id: history._id }, { status: 201 })
  } catch (error) {
    console.error("Error saving search history:", error)
    return NextResponse.json({ error: "Failed to save search history" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""

    await dbConnect()

    // Check if user is org-admin
    const user = await User.findById(session.user.id)
    const isOrgAdmin = user?.role === "org-admin"
    const organizationId = (session.user as any).organizationId || user?.organizationId

    // Build query based on role
    let query: any = {}
    
    if (isOrgAdmin && organizationId) {
      // Org-admin sees all organization history
      query.organizationId = organizationId
    } else {
      // Regular users see only their own history
      query.userId = session.user.id
    }

    if (search) {
      query.query = { $regex: search, $options: "i" }
    }

    const skip = (page - 1) * limit

    const [history, total] = await Promise.all([
      SearchHistory.find(query)
        .select("-results") // Exclude results to reduce payload size
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SearchHistory.countDocuments(query),
    ])

    return NextResponse.json({
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      isOrgAdmin,
    })
  } catch (error) {
    console.error("Error fetching search history:", error)
    return NextResponse.json({ error: "Failed to fetch search history" }, { status: 500 })
  }
}
