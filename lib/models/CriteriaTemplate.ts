import mongoose, { Schema, models } from "mongoose"

export interface IOutputSchemaItem {
  key: string
  description: string
}

export interface ICriterion {
  id: string
  name: string
  description: string
  outputSchema: IOutputSchemaItem[]
}

export interface ICriteriaTemplate {
  _id: string
  name: string
  description: string
  criteria: ICriterion[]
  userId: string
  organizationId?: string
  visibility: "private" | "public"
  createdBy: string // username for display
  createdAt: Date
  updatedAt: Date
}

const outputSchemaItemSchema = new Schema<IOutputSchemaItem>(
  {
    key: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { _id: false }
)

const criterionSchema = new Schema<ICriterion>(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    outputSchema: {
      type: [outputSchemaItemSchema],
      default: [],
    },
  },
  { _id: false }
)

const criteriaTemplateSchema = new Schema<ICriteriaTemplate>(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    criteria: {
      type: [criterionSchema],
      required: true,
      validate: {
        validator: function (v: ICriterion[]) {
          return v && v.length > 0
        },
        message: "At least one criterion is required",
      },
    },
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    organizationId: {
      type: String,
      required: false,
      index: true,
    },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
    createdBy: {
      type: String,
      required: [true, "Creator name is required"],
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient queries
criteriaTemplateSchema.index({ userId: 1, createdAt: -1 })
criteriaTemplateSchema.index({ organizationId: 1, visibility: 1, createdAt: -1 })

const CriteriaTemplate =
  models.CriteriaTemplate ||
  mongoose.model<ICriteriaTemplate>("CriteriaTemplate", criteriaTemplateSchema)

export default CriteriaTemplate
