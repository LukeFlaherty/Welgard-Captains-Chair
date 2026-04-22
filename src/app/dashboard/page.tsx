import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <main className="flex flex-col gap-8 p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome — your workspace is ready.
          </p>
        </div>
        <Badge variant="outline">PRD stub</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["Metric A", "Metric B", "Metric C"].map((label) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">—</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Main Content Area</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Replace this with your PRD-driven features.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
