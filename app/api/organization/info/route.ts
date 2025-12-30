import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Organization from "@/lib/models/Organization"
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

    return NextResponse.json({
      success: true,
      organization: {
        _id: organization._id,
        name: organization.name,
        createdBy: organization.createdBy,
        members: organization.members,
        settings: organization.settings,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      },
    })
  } catch (error: any) {
    console.error("Fetch organization error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch organization" },
      { status: 500 }
    )
  }
}
