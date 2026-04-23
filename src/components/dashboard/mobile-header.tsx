"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, ChevronRight, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { navItems } from "./nav-config";

export function MobileHeader({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <>
      <header className="flex md:hidden items-center justify-between h-32 px-4 border-b bg-primary shrink-0">
        <Image
          src="/welgard-logos/wg-logo-white-on-blue-bg.webp"
          alt="Welgard"
          width={120}
          height={120}
          className="rounded-lg"
        />
        <button
          onClick={() => setOpen(true)}
          className="text-primary-foreground p-1 -mr-1"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-64 p-0 gap-0">
          {/* Brand */}
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
          <nav className="flex flex-col gap-0.5 px-3 py-3 flex-1">
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.comingSoon ? "#" : item.href}
                  aria-disabled={item.comingSoon}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : item.comingSoon
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={(e) => {
                    if (item.comingSoon) {
                      e.preventDefault();
                    } else {
                      setOpen(false);
                    }
                  }}
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

          {/* Footer */}
          <div className="px-3 py-3 border-t mt-auto flex flex-col gap-1">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign out</span>
            </button>
            <p className="text-[10px] text-muted-foreground px-3">
              Internal Ops Dashboard · v1
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
