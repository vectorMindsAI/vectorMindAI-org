import mongoose, { Schema, models } from "mongoose"

export interface IOrganization {
  _id: string
  name: string
  createdBy: string
  members: Array<{
    userId: string
    role: "org-admin" | "member"
    joinedAt: Date
    invitedBy?: string
  }>
  invites: Array<{
    code: string
    email?: string
    role: "member"
    createdBy: string
    expiresAt: Date
    used: boolean
    usedBy?: string
    usedAt?: Date
  }>
  joinRequests: Array<{
    userId: string
    userName: string
    userEmail: string
    userImage?: string
    status: "pending" | "approved" | "rejected"
    requestedAt: Date
    respondedAt?: Date
    respondedBy?: string
  }>
  settings: {
    allowMemberInvites: boolean
    dataRetentionDays?: number
    requireApproval: boolean
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    createdBy: {
      type: String,
      required: [true, "Creator ID is required"],
      index: true,
    },
    members: {
      type: [
        {
          userId: {
            type: String,
            required: true,
          },
          role: {
            type: String,
            enum: ["org-admin", "member"],
            default: "member",
          },
          joinedAt: {
            type: Date,
            default: Date.now,
          },
          invitedBy: {
            type: String,
            required: false,
          },
        },
      ],
      default: [],
    },
    invites: {
      type: [
        {
          code: {
            type: String,
            required: true,
          },
          email: {
            type: String,
            required: false,
          },
          role: {
            type: String,
            enum: ["member"],
            default: "member",
          },
          createdBy: {
            type: String,
            required: true,
          },
          expiresAt: {
            type: Date,
            required: true,
          },
          used: {
            type: Boolean,
            default: false,
          },
          usedBy: {
            type: String,
            required: false,
          },
          usedAt: {
            type: Date,
            required: false,
          },
        },
      ],
      default: [],
    },
    joinRequests: {
      type: [
        {
          userId: {
            type: String,
            required: true,
          },
          userName: {
            type: String,
            required: true,
          },
          userEmail: {
            type: String,
            required: true,
          },
          userImage: {
            type: String,
            required: false,
          },
          status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
          },
          requestedAt: {
            type: Date,
            default: Date.now,
          },
          respondedAt: {
            type: Date,
            required: false,
          },
          respondedBy: {
            type: String,
            required: false,
          },
        },
      ],
      default: [],
    },
    settings: {
      type: {
        allowMemberInvites: {
          type: Boolean,
          default: false,
        },
        dataRetentionDays: {
          type: Number,
          required: false,
        },
        requireApproval: {
          type: Boolean,
          default: false,
        },
      },
      default: {
        allowMemberInvites: false,
        requireApproval: false,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient queries
organizationSchema.index({ createdBy: 1 })
organizationSchema.index({ "members.userId": 1 })
organizationSchema.index({ "invites.code": 1 }, { sparse: true })
organizationSchema.index({ "invites.email": 1 })

const Organization = models.Organization || mongoose.model<IOrganization>("Organization", organizationSchema)

export default Organization
