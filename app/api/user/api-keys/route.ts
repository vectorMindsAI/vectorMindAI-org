import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import { requireAuth } from "@/lib/auth-helpers"

// GET - Retrieve user's API keys
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()

    await dbConnect()

    const user = await User.findById(session.user.id).select("apiKeys")

    if (!user) {
      console.error("User not found for GET:", session.user.id)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("Retrieved API keys for user:", session.user.id, user.apiKeys)

    return NextResponse.json({
      success: true,
      apiKeys: user.apiKeys || [],
    })
  } catch (error: any) {
    console.error("Get API keys error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to retrieve API keys" },
      { status: 500 }
    )
  }
}

// POST - Save user's API keys
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { apiKeys } = await req.json()

    console.log("Saving API keys:", { userId: session.user.id, apiKeys })

    if (!Array.isArray(apiKeys)) {
      return NextResponse.json(
        { error: "apiKeys must be an array" },
        { status: 400 }
      )
    }

    await dbConnect()

    // Filter out empty keys
    const validKeys = apiKeys.filter(k => k.provider && k.apiKey)
    console.log("Valid keys:", validKeys)

    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: { apiKeys: validKeys },
      },
      { new: true, runValidators: true }
    )

    if (!user) {
      console.error("User not found:", session.user.id)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("User updated successfully:", user.apiKeys)

    return NextResponse.json({
      success: true,
      message: "API keys saved successfully",
      apiKeys: user.apiKeys,
    })
  } catch (error: any) {
    console.error("Save API keys error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save API keys" },
      { status: 500 }
    )
  }
}
