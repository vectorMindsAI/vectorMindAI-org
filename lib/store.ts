import dbConnect from './mongodb';
import JobModel, { IJob } from './models/Job';

export interface Job {
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

export const jobStore = {
    create: async (id: string): Promise<Job> => {
        await dbConnect();
        
        const newJob = await JobModel.create({
            id,
            status: 'pending',
            progress: 0,
            logs: [],
            result: null,
            createdAt: Date.now(),
        });
        
        return newJob.toObject();
    },

    update: async (id: string, updates: Partial<Job>): Promise<Job | null> => {
        await dbConnect();
        
        const job = await JobModel.findOneAndUpdate(
            { id },
            { $set: updates },
            { new: true }
        );
        
        return job ? job.toObject() : null;
    },

    addLog: async (id: string, log: { type: string; message: string }): Promise<void> => {
        await dbConnect();
        
        await JobModel.findOneAndUpdate(
            { id },
            { 
                $push: { 
                    logs: { 
                        ...log, 
                        timestamp: Date.now() 
                    } 
                } 
            }
        );
    },

    get: async (id: string): Promise<Job | null> => {
        try {
            await dbConnect();
            const job = await JobModel.findOne({ id });
            return job ? job.toObject() : null;
        } catch (e) {
            console.error('Error fetching job:', e);
            return null;
        }
    }
};
