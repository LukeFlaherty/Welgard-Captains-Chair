import {
  LayoutDashboard,
  ClipboardCheck,
  UserCheck,
  Users,
  Building2,
  FileText,
  Settings,
} from "lucide-react";
import type { ElementType } from "react";

export type NavItem = {
  label: string;
  href: string;
  icon: ElementType;
  comingSoon?: boolean;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inspections", href: "/inspections", icon: ClipboardCheck },
  { label: "Inspectors", href: "/inspectors", icon: UserCheck },
  { label: "Members", href: "/members", icon: Users, comingSoon: true },
  { label: "Vendors", href: "/vendors", icon: Building2, comingSoon: true },
  { label: "Reports", href: "/reports", icon: FileText, comingSoon: true },
  { label: "Settings", href: "/settings", icon: Settings, comingSoon: true },
];
