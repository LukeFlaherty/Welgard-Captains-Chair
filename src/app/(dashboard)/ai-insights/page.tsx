import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { InsightsPanel } from "@/components/ai-insights/insights-panel";
import { getLatestInsight } from "@/actions/ai-insights";

export const metadata: Metadata = { title: "AI Insights" };

export const dynamic = "force-dynamic";

export default async function AiInsightsPage() {
  const session = await auth();
  const role = session?.user?.role ?? "vendor";

  if (role !== "admin" && role !== "team_member") {
    redirect("/dashboard");
  }

  const latest = await getLatestInsight();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-start gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-muted-foreground mt-0.5" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            On-demand analysis of platform activity. Surfaces priorities for operations and sales.
          </p>
        </div>
      </div>

      <InsightsPanel
        isAdmin={role === "admin"}
        initialInsight={
          latest
            ? { text: latest.text, generatedBy: latest.generatedBy, createdAt: latest.createdAt }
            : null
        }
      />
    </div>
  );
}
