import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import connectDB from "@/lib/mongodb"
import CriteriaTemplate from "@/lib/models/CriteriaTemplate"
import User from "@/lib/models/User"

/**
 * GET /api/criteria-templates/[id]
 * Fetches a single template by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    await connectDB()

    const template = await CriteriaTemplate.findById(params.id)

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Get user to check ownership
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user._id.toString()

    // Check if user has access (owner OR public template in same org)
    const isOwner = template.userId === userId
    const isPublicInOrg =
      template.visibility === "public" &&
      user.organizationId &&
      template.organizationId === user.organizationId

    if (!isOwner && !isPublicInOrg) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json(
      {
        template: {
          _id: template._id.toString(),
          name: template.name,
          description: template.description,
          criteria: template.criteria,
          visibility: template.visibility,
          createdBy: template.createdBy,
          userId: template.userId,
          organizationId: template.organizationId,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
          isOwner,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error fetching template:", error)
    return NextResponse.json(
      { error: "Failed to fetch template", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/criteria-templates/[id]
 * Updates an existing template (owner only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const { name, description, criteria, visibility } = body

    // Validation
    if (name && !name.trim()) {
      return NextResponse.json(
        { error: "Template name cannot be empty" },
        { status: 400 }
      )
    }

    if (criteria && (!Array.isArray(criteria) || criteria.length === 0)) {
      return NextResponse.json(
        { error: "At least one criterion is required" },
        { status: 400 }
      )
    }

    if (visibility && !["private", "public"].includes(visibility)) {
      return NextResponse.json(
        { error: 'Visibility must be "private" or "public"' },
        { status: 400 }
      )
    }

    await connectDB()

    // Get user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user._id.toString()

    // Find template
    const template = await CriteriaTemplate.findById(params.id)
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Check ownership
    if (template.userId !== userId) {
      return NextResponse.json(
        { error: "Only the template owner can update it" },
        { status: 403 }
      )
    }

    // Update fields
    if (name) template.name = name.trim()
    if (description !== undefined) template.description = description.trim()
    if (criteria) template.criteria = criteria
    if (visibility) template.visibility = visibility

    await template.save()

    return NextResponse.json(
      {
        message: "Template updated successfully",
        template: {
          _id: template._id.toString(),
          name: template.name,
          description: template.description,
          criteria: template.criteria,
          visibility: template.visibility,
          createdBy: template.createdBy,
          userId: template.userId,
          organizationId: template.organizationId,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
          isOwner: true,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error updating template:", error)
    return NextResponse.json(
      { error: "Failed to update template", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/criteria-templates/[id]
 * Deletes a template (owner only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()

    await connectDB()

    // Get user
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user._id.toString()

    // Find template
    const template = await CriteriaTemplate.findById(params.id)
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Check ownership
    if (template.userId !== userId) {
      return NextResponse.json(
        { error: "Only the template owner can delete it" },
        { status: 403 }
      )
    }

    await CriteriaTemplate.findByIdAndDelete(params.id)

    return NextResponse.json(
      { message: "Template deleted successfully" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error deleting template:", error)
    return NextResponse.json(
      { error: "Failed to delete template", details: error.message },
      { status: 500 }
    )
  }
}
