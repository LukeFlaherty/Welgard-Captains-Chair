"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { navItems } from "./nav-config";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="flex md:hidden items-center justify-between h-20 px-4 border-b bg-primary shrink-0">
        <Image
          src="/welgard-logos/wg-logo-white-on-blue-bg.webp"
          alt="Welgard"
          width={60}
          height={60}
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
            {navItems.map((item) => {
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
          <div className="px-4 py-3 border-t mt-auto">
            <p className="text-[10px] text-muted-foreground">
              Internal Ops Dashboard · v1
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
