import mongoose, { Schema, models } from "mongoose"

export interface IUser {
  _id: string
  name: string
  email: string
  password?: string
  image?: string
  provider?: string
  role: "individual" | "org-admin" | "member"
  organizationId?: string
  joinedAt?: Date
  apiKeys?: Array<{
    provider: string
    apiKey: string
  }>
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
    role: {
      type: String,
      enum: ["individual", "org-admin", "member"],
      default: "individual",
      required: true,
    },
    organizationId: {
      type: String,
      required: false,
      index: true,
    },
    joinedAt: {
      type: Date,
      required: false,
    },
    apiKeys: [
      {
        provider: {
          type: String,
          required: true,
        },
        apiKey: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Index for organization queries
userSchema.index({ organizationId: 1, role: 1 })

const User = models.User || mongoose.model<IUser>("User", userSchema)

export default User
