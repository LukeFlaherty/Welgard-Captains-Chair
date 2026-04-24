import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role ?? "vendor";
  const user = {
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
    companyName: session?.user?.companyName ?? null,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={role} user={user} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <MobileHeader role={role} user={user} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
