
import { createPlannerAgent } from "../../../lib/agents/planner";
import { auth } from "@/auth";

export async function POST(req: Request) {
    // Trigger Rebuild
    try {
        const { userInput, apiKey, model } = await req.json();

        if (!userInput) {
            return new Response("User Input is required", { status: 400 });
        }

        // Get user session for organization context
        const session = await auth();
        const userId = session?.user?.id;
        const organizationId = (session?.user as any)?.organizationId;

        const planner = createPlannerAgent({ apiKey, model });
        const plan = await planner.generatePlan(userInput);

        // Include organization context in response metadata
        return new Response(JSON.stringify({ 
            success: true, 
            plan,
            metadata: {
                userId,
                organizationId,
            }
        }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        console.error("Planner Error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
