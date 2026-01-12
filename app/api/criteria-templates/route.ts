import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import connectDB from "@/lib/mongodb"
import CriteriaTemplate from "@/lib/models/CriteriaTemplate"
import User from "@/lib/models/User"

/**
 * GET /api/criteria-templates
 * Returns user's private templates + organization's public templates
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()

    await connectDB()

    // Get user data
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user._id.toString()
    const organizationId = user.organizationId

    // Query for user's private templates
    const privateTemplates = await CriteriaTemplate.find({
      userId: userId,
    }).sort({ createdAt: -1 })

    // Query for organization's public templates (if user belongs to an org)
    let publicTemplates = []
    if (organizationId) {
      publicTemplates = await CriteriaTemplate.find({
        organizationId: organizationId,
        visibility: "public",
        userId: { $ne: userId }, // Exclude user's own public templates (already in privateTemplates)
      }).sort({ createdAt: -1 })
    }

    // Merge and return
    const templates = [
      ...privateTemplates.map((t) => ({
        _id: t._id.toString(),
        name: t.name,
        description: t.description,
        criteria: t.criteria,
        visibility: t.visibility,
        createdBy: t.createdBy,
        userId: t.userId,
        organizationId: t.organizationId,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        isOwner: true,
      })),
      ...publicTemplates.map((t) => ({
        _id: t._id.toString(),
        name: t.name,
        description: t.description,
        criteria: t.criteria,
        visibility: t.visibility,
        createdBy: t.createdBy,
        userId: t.userId,
        organizationId: t.organizationId,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        isOwner: false,
      })),
    ]

    console.log(`📤 Returning ${templates.length} templates to client`)
    templates.forEach(t => {
      console.log(`  - ${t.name}: ${t.criteria.length} criteria`)
    })

    return NextResponse.json({ templates }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching criteria templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch templates", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/criteria-templates
 * Creates a new criteria template
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await req.json()
    const { name, description, criteria, visibility } = body

    console.log('📥 POST /api/criteria-templates - Saving template:', name)
    console.log('📥 Criteria count:', criteria?.length || 0)
    console.log('📥 Criteria data:', JSON.stringify(criteria, null, 2))

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      )
    }

    if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
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

    // Get user data
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create template
    const template = new CriteriaTemplate({
      name: name.trim(),
      description: description?.trim() || "",
      criteria,
      userId: user._id.toString(),
      organizationId: user.organizationId || undefined,
      visibility: visibility || "private",
      createdBy: user.name,
    })

    await template.save()

    return NextResponse.json(
      {
        message: "Template created successfully",
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
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating criteria template:", error)
    return NextResponse.json(
      { error: "Failed to create template", details: error.message },
      { status: 500 }
    )
  }
}
