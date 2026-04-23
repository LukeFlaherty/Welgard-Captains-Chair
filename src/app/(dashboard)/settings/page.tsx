import type { Metadata } from "next";
import Link from "next/link";
import { Settings, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage the platform and team access.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">User Management</CardTitle>
            </div>
            <CardDescription>
              Add or remove team members and vendors. Manage their access roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/settings/users"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Manage Users
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
