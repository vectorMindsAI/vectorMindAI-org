import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Organization from "@/lib/models/Organization"
import { requireOrgAdmin } from "@/lib/auth-helpers"

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireOrgAdmin()
    const { name } = await req.json()

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Organization name must be at least 2 characters" },
        { status: 400 }
      )
    }

    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: "Not part of an organization" },
        { status: 400 }
      )
    }

    await dbConnect()

    const organization = await Organization.findByIdAndUpdate(
      session.user.organizationId,
      { name: name.trim() },
      { new: true }
    )

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
      },
    })
  } catch (error: any) {
    console.error("Update organization error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update organization" },
      { status: 500 }
    )
  }
}
