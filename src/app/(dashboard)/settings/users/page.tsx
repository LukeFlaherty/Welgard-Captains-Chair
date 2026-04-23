import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { listUsers } from "@/actions/users";
import { listInspectorsForSelect } from "@/actions/inspectors";
import { UserManagement } from "@/components/settings/user-management";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "User Management" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [session, users, inspectors] = await Promise.all([auth(), listUsers(), listInspectorsForSelect()]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
        >
          <ArrowLeft className="w-4 h-4" />
          Settings
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add team members and vendors, and manage their platform access.
        </p>
      </div>

      <UserManagement users={users} currentUserId={session?.user?.id ?? ""} inspectors={inspectors} />
    </div>
  );
}
