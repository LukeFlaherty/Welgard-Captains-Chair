import {
  LayoutDashboard,
  ClipboardCheck,
  UserCheck,
  Users,
  Building2,
  FileText,
  Settings,
  UserCircle,
  Wrench,
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
    roles: ["admin", "team_member", "vendor"],
  },
  {
    label: "Service Tickets",
    href: "/service-tickets",
    icon: Wrench,
    roles: ["admin", "team_member", "vendor"],
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
    roles: ["admin", "team_member"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileText,
    comingSoon: true,
    roles: ["admin", "team_member"],
  },
  { label: "Settings", href: "/settings/users", icon: Settings, roles: ["team_member"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
  { label: "Account", href: "/account", icon: UserCircle },
];
