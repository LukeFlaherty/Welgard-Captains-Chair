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
  /** Roles that can see this item. Undefined = all authenticated roles. */
  roles?: string[];
};

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "team_member"],
  },
  { label: "Inspections", href: "/inspections", icon: ClipboardCheck },
  {
    label: "Inspectors",
    href: "/inspectors",
    icon: UserCheck,
    roles: ["admin", "team_member"],
  },
  {
    label: "Members",
    href: "/members",
    icon: Users,
    comingSoon: true,
    roles: ["admin", "team_member"],
  },
  {
    label: "Vendors",
    href: "/vendors",
    icon: Building2,
    comingSoon: true,
    roles: ["admin", "team_member"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileText,
    comingSoon: true,
    roles: ["admin", "team_member"],
  },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
];
