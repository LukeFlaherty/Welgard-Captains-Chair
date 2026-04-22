"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Building2,
  FileText,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  active?: boolean;
  comingSoon?: boolean;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inspections", href: "/inspections", icon: ClipboardCheck, active: true },
  { label: "Members", href: "/members", icon: Users, comingSoon: true },
  { label: "Vendors", href: "/vendors", icon: Building2, comingSoon: true },
  { label: "Reports", href: "/reports", icon: FileText, comingSoon: true },
  { label: "Settings", href: "/settings", icon: Settings, comingSoon: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 border-r bg-card min-h-screen shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-4 border-b">
        <Image
          src="/welgard-logos/wg-logo-white-on-blue-bg.webp"
          alt="Welgard"
          width={36}
          height={36}
          className="rounded-lg shrink-0"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight leading-none">Welgard</span>
          <span className="text-[10px] text-muted-foreground leading-none mt-0.5 uppercase tracking-wider">
            Operations
          </span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/inspections"
                ? pathname.startsWith("/inspections")
                : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.comingSoon ? "#" : item.href}
                aria-disabled={item.comingSoon}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : item.comingSoon
                    ? "text-muted-foreground/50 cursor-not-allowed"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={(e) => item.comingSoon && e.preventDefault()}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.comingSoon && (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                    Soon
                  </Badge>
                )}
                {isActive && !item.comingSoon && (
                  <ChevronRight className="w-3 h-3 opacity-60" />
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-3 border-t">
        <p className="text-[10px] text-muted-foreground">
          Internal Ops Dashboard · v1
        </p>
      </div>
    </aside>
  );
}
