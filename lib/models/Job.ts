import mongoose from "mongoose";

export interface IJob {
  id: string;
  status: 'pending' | 'processing' | 'waiting_for_selection' | 'completed' | 'failed';
  progress: number;
  logs: { type: string; message: string; timestamp: number }[];
  result: any | null;
  candidateLinks?: { url: string; title: string; snippet: string }[];
  createdAt: number;
  userId?: string;
  organizationId?: string;
  userName?: string;
  userEmail?: string;
}

const JobSchema = new mongoose.Schema<IJob>({
  id: { type: String, required: true, unique: true, index: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'processing', 'waiting_for_selection', 'completed', 'failed'],
    default: 'pending'
  },
  progress: { type: Number, required: true, default: 0 },
  logs: [{ 
    type: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Number, required: true }
  }],
  result: { type: mongoose.Schema.Types.Mixed, default: null },
  candidateLinks: [{
    url: { type: String },
    title: { type: String },
    snippet: { type: String }
  }],
  createdAt: { type: Number, required: true, default: Date.now },
  userId: { type: String },
  organizationId: { type: String, index: true },
  userName: { type: String },
  userEmail: { type: String }
}, {
  timestamps: false
});

// Add index for faster queries
JobSchema.index({ organizationId: 1, createdAt: -1 });
JobSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);
