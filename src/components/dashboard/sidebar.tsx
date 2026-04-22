"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { navItems } from "./nav-config";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card min-h-screen shrink-0">
      {/* Brand — logo only with brand blue background */}
      <div className="flex items-center justify-center px-4 py-6 bg-primary">
        <Image
          src="/welgard-logos/wg-logo-white-on-blue-bg.webp"
          alt="Welgard"
          width={160}
          height={160}
          className="rounded-xl shrink-0"
        />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

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
