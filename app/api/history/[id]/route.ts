import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import dbConnect from "@/lib/mongodb"
import SearchHistory from "@/lib/models/SearchHistory"
import User from "@/lib/models/User"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const { id } = await params

    // Get user to check role and organization
    const user = await User.findById(session.user.id)
    const isOrgAdmin = user?.role === "org-admin"
    const organizationId = (session.user as any).organizationId || user?.organizationId

    // Build query based on role
    let query: any = { _id: id }
    
    if (isOrgAdmin && organizationId) {
      // Org-admin can view any history in their organization
      query.organizationId = organizationId
    } else {
      // Regular users can only view their own history
      query.userId = session.user.id
    }

    const history = await SearchHistory.findOne(query).lean()

    if (!history) {
      return NextResponse.json({ error: "History not found" }, { status: 404 })
    }

    return NextResponse.json(history)
  } catch (error) {
    console.error("Error fetching search history:", error)
    return NextResponse.json({ error: "Failed to fetch search history" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const { id } = await params

    // Get user to check role and organization
    const user = await User.findById(session.user.id)
    const isOrgAdmin = user?.role === "org-admin"
    const organizationId = (session.user as any).organizationId || user?.organizationId

    // Build query based on role
    let query: any = { _id: id }
    
    if (isOrgAdmin && organizationId) {
      // Org-admin can delete any history in their organization
      query.organizationId = organizationId
    } else {
      // Regular users can only delete their own history
      query.userId = session.user.id
    }

    const result = await SearchHistory.deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "History not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting search history:", error)
    return NextResponse.json({ error: "Failed to delete search history" }, { status: 500 })
  }
}
