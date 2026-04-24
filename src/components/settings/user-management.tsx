"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { UserPlus, Trash2, Loader2, ShieldCheck, Users, Wrench, Building2, KeyRound, Copy, RefreshCw, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

import { createUser, deleteUser, updateUserRole, linkVendorToUser, resetUserPassword } from "@/actions/users";
import type { UserRow } from "@/actions/users";

// ─── Role helpers ─────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  team_member: "Team Member",
  vendor: "Vendor",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  admin: ShieldCheck,
  team_member: Users,
  vendor: Wrench,
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/30",
  team_member: "bg-blue-100 text-blue-700 border-blue-300",
  vendor: "bg-amber-100 text-amber-700 border-amber-300",
};

function RoleBadge({ role }: { role: string }) {
  const Icon = ROLE_ICONS[role] ?? Users;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_COLORS[role] ?? "bg-muted text-muted-foreground border-border"}`}
    >
      <Icon className="w-3 h-3" />
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

// ─── Add User form schema ─────────────────────────────────────────────────────

const addUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "team_member", "vendor"]),
  vendorId: z.string().optional(),
  createNewVendor: z.boolean().optional(),
  newVendorName: z.string().optional(),
  newVendorEmail: z.string().optional(),
  newVendorPhone: z.string().optional(),
});

type AddUserValues = z.infer<typeof addUserSchema>;

// ─── Password generator ───────────────────────────────────────────────────────

function generatePassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ─── Reset Password Dialog ────────────────────────────────────────────────────

function ResetPasswordDialog({ user }: { user: UserRow }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleGenerate() {
    const p = generatePassword();
    setPassword(p);
    setShowPassword(true);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleReset() {
    if (!password) return;
    setLoading(true);
    const result = await resetUserPassword(user.id, password);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Password reset for ${user.email}. Share it securely.`);
    setPassword("");
    setShowPassword(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setPassword(""); setShowPassword(false); } }}>
      <DialogTrigger render={
        <Button size="icon-sm" variant="ghost" title="Reset password" className="text-muted-foreground hover:text-amber-600" />
      }>
        <KeyRound className="w-3.5 h-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a temporary password for <strong>{user.email}</strong>. They will be required to change it on next login.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tmp-password">Temporary Password</Label>
            <div className="flex gap-2">
              <Input
                id="tmp-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter or generate…"
                className="flex-1 font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPassword((s) => !s)}
                className="shrink-0"
              >
                {showPassword ? "Hide" : "Show"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5 flex-1" onClick={handleGenerate}>
              <RefreshCw className="w-3.5 h-3.5" />
              Generate
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 flex-1"
              onClick={handleCopy}
              disabled={!password}
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 p-3 text-xs text-amber-800 dark:text-amber-300">
            Share this password with the user securely (e.g. by phone). They must change it before accessing the app.
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button onClick={handleReset} disabled={!password || loading} className="gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Resetting…" : "Reset Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type VendorOption = { id: string; companyName: string };

type Props = {
  users: UserRow[];
  currentUserId: string;
  currentUserRole: string;
  vendors: VendorOption[];
};

// ─── Main component ───────────────────────────────────────────────────────────

export function UserManagement({ users: initialUsers, currentUserId, currentUserRole, vendors: initialVendors }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [vendors, setVendors] = useState<VendorOption[]>(initialVendors);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = currentUserRole === "admin";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddUserValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(addUserSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: isAdmin ? "team_member" : "vendor",
      vendorId: "",
      createNewVendor: false,
      newVendorName: "",
      newVendorEmail: "",
      newVendorPhone: "",
    },
  });

  const watchedRole = watch("role");
  const watchedVendorId = watch("vendorId");
  const watchedCreateNewVendor = watch("createNewVendor");
  const watchedNewVendorName = watch("newVendorName");

  // ── Add user ────────────────────────────────────────────────────────────────
  async function onAddUser(values: AddUserValues) {
    const payload: Parameters<typeof createUser>[0] = {
      name: values.name ?? "",
      email: values.email,
      password: values.password,
      role: values.role,
      vendorId: values.role === "vendor" && !values.createNewVendor ? (values.vendorId ?? null) : null,
      newVendorName: values.role === "vendor" && values.createNewVendor ? (values.newVendorName ?? undefined) : undefined,
      newVendorEmail: values.role === "vendor" && values.createNewVendor ? (values.newVendorEmail ?? undefined) : undefined,
      newVendorPhone: values.role === "vendor" && values.createNewVendor ? (values.newVendorPhone ?? undefined) : undefined,
    };

    if (values.role === "vendor" && values.createNewVendor && !values.newVendorName) {
      toast.error("Company name is required when creating a new vendor company.");
      return;
    }

    const result = await createUser(payload);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.user) {
      setUsers((prev) => [...prev, result.user!]);
      // If a new vendor was created, add it to the local vendors list
      if (values.createNewVendor && result.user.companyName && result.user.vendorId) {
        setVendors((prev) => [...prev, { id: result.user!.vendorId!, companyName: result.user!.companyName! }]);
      }
      toast.success(`${result.user.email} added successfully.`);
      reset({
        name: "", email: "", password: "",
        role: isAdmin ? "team_member" : "vendor",
        vendorId: "", createNewVendor: false,
        newVendorName: "", newVendorEmail: "", newVendorPhone: "",
      });
      setDialogOpen(false);
    }
  }

  // ── Change role ─────────────────────────────────────────────────────────────
  function handleRoleChange(userId: string, newRole: string) {
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, role: newRole, vendorId: newRole !== "vendor" ? null : u.vendorId, companyName: newRole !== "vendor" ? null : u.companyName }
            : u
        )
      );
      toast.success("Role updated.");
    });
  }

  // ── Link vendor company ──────────────────────────────────────────────────────
  function handleLinkVendor(userId: string, vendorId: string | null) {
    startTransition(async () => {
      const result = await linkVendorToUser(userId, vendorId || null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const vendor = vendors.find((v) => v.id === vendorId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, vendorId: vendorId ?? null, companyName: vendor?.companyName ?? null }
            : u
        )
      );
      toast.success(vendorId ? "Company linked." : "Company unlinked.");
    });
  }

  // ── Delete user ─────────────────────────────────────────────────────────────
  function handleDelete(userId: string) {
    setDeletingId(userId);
  }

  async function confirmDelete(userId: string) {
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.error) {
        toast.error(result.error);
        setDeletingId(null);
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setDeletingId(null);
      toast.success("User removed.");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Role legend — only show all roles for admins */}
      <div className="flex flex-wrap gap-4 p-4 border rounded-xl bg-muted/30">
        {(isAdmin ? ["admin", "team_member", "vendor"] : ["vendor"]).map((role) => (
          <div key={role} className="flex flex-col gap-1">
            <RoleBadge role={role} />
            <p className="text-xs text-muted-foreground ml-1">
              {role === "admin" && "Full access + user management"}
              {role === "team_member" && "Full dashboard, no user settings"}
              {role === "vendor" && "Inspections only — filtered to their company"}
            </p>
          </div>
        ))}
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {users.length} {users.length === 1 ? "user" : "users"}
        </p>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) reset({
            name: "", email: "", password: "",
            role: isAdmin ? "team_member" : "vendor",
            vendorId: "", createNewVendor: false,
            newVendorName: "", newVendorEmail: "", newVendorPhone: "",
          });
        }}>
          <DialogTrigger render={<Button size="sm" className="gap-2" />}>
            <UserPlus className="w-4 h-4" />
            Add User
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add a new user</DialogTitle>
              <DialogDescription>
                {isAdmin
                  ? "Create an account and share the credentials with the team member or vendor."
                  : "Create a vendor account and share the credentials with the inspection company."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onAddUser)} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Jane Smith" {...register("name")} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input id="email" type="email" placeholder="jane@company.com" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">
                  Temporary Password <span className="text-destructive">*</span>
                </Label>
                <Input id="password" type="password" placeholder="Min. 8 characters" {...register("password")} />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Role picker — admins see all options; team_members only see vendor */}
              {isAdmin && (
                <div className="flex flex-col gap-1.5">
                  <Label>Role <span className="text-destructive">*</span></Label>
                  <Select
                    value={watchedRole}
                    onValueChange={(v) => {
                      setValue("role", v as AddUserValues["role"]);
                      setValue("vendorId", "");
                      setValue("createNewVendor", false);
                      setValue("newVendorName", "");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin — full access</SelectItem>
                      <SelectItem value="team_member">Team Member — dashboard access</SelectItem>
                      <SelectItem value="vendor">Vendor — inspections + inspectors (own company)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Vendor company section — shown for vendor role */}
              {watchedRole === "vendor" && (
                <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 p-3">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <Label className="text-sm font-medium">Inspection Company</Label>
                  </div>

                  {/* Toggle: existing vs new */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setValue("createNewVendor", false); setValue("newVendorName", ""); }}
                      className={`flex-1 text-xs py-1.5 px-3 rounded-md border transition-colors ${!watchedCreateNewVendor ? "bg-white border-amber-400 text-amber-800 font-medium shadow-sm" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                      Existing company
                    </button>
                    <button
                      type="button"
                      onClick={() => { setValue("createNewVendor", true); setValue("vendorId", ""); }}
                      className={`flex-1 text-xs py-1.5 px-3 rounded-md border transition-colors ${watchedCreateNewVendor ? "bg-white border-amber-400 text-amber-800 font-medium shadow-sm" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                      <span className="flex items-center justify-center gap-1">
                        <PlusCircle className="w-3 h-3" />
                        Create new
                      </span>
                    </button>
                  </div>

                  {!watchedCreateNewVendor ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Select the vendor company this user represents.
                      </p>
                      <Select
                        value={watchedVendorId ?? ""}
                        onValueChange={(v) => setValue("vendorId", v ?? undefined)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select company…" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.length === 0 && (
                            <SelectItem value="" disabled>No vendor companies yet — create one below</SelectItem>
                          )}
                          {vendors.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!watchedVendorId && (
                        <p className="text-xs text-amber-700">
                          No company linked — user can log in but will see no data until linked.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        A new vendor company will be created and linked to this user.
                      </p>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="newVendorName" className="text-xs">
                          Company Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="newVendorName"
                          placeholder="ClearWater Inspection Services"
                          className="text-sm"
                          {...register("newVendorName")}
                        />
                        {!watchedNewVendorName && (
                          <p className="text-xs text-destructive">Required</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="newVendorEmail" className="text-xs">Company Email</Label>
                          <Input id="newVendorEmail" type="email" placeholder="info@company.com" className="text-sm" {...register("newVendorEmail")} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="newVendorPhone" className="text-xs">Company Phone</Label>
                          <Input id="newVendorPhone" placeholder="555-000-0000" className="text-sm" {...register("newVendorPhone")} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <DialogFooter showCloseButton>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? "Creating…" : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isConfirmingDelete = deletingId === user.id;
              // Team members can only manage vendor users
              const canManage = isAdmin || user.role === "vendor";

              return (
                <TableRow key={user.id}>
                  {/* User info */}
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">
                        {user.name ?? "—"}
                        {isSelf && (
                          <Badge variant="secondary" className="ml-2 text-[9px] px-1 py-0 h-4">
                            You
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>

                  {/* Role selector */}
                  <TableCell>
                    {isSelf || !isAdmin ? (
                      <RoleBadge role={user.role} />
                    ) : (
                      <Select
                        value={user.role}
                        onValueChange={(v) => v && handleRoleChange(user.id, v)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-36 h-7 text-xs">
                          <span className="flex-1 text-left">{ROLE_LABELS[user.role] ?? user.role}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="team_member">Team Member</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>

                  {/* Company — only relevant for vendor users */}
                  <TableCell>
                    {user.role === "vendor" ? (
                      <div className="flex flex-col gap-1">
                        {user.companyName && (
                          <span className="text-xs font-medium flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                            {user.companyName}
                          </span>
                        )}
                        {!isSelf && canManage && (
                          <Select
                            value={user.vendorId ?? ""}
                            onValueChange={(v) => handleLinkVendor(user.id, v || null)}
                            disabled={isPending}
                          >
                            <SelectTrigger className="w-44 h-7 text-xs">
                              <span className="flex-1 text-left truncate text-muted-foreground">
                                {user.vendorId
                                  ? (vendors.find((v) => v.id === user.vendorId)?.companyName ?? "Linked")
                                  : "Link company…"}
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No link</SelectItem>
                              {vendors.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.companyName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Joined */}
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    {isSelf ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : !canManage ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : isConfirmingDelete ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-destructive">Remove?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => confirmDelete(user.id)}
                          className="h-7 text-xs gap-1"
                        >
                          {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingId(null)}
                          className="h-7 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin && <ResetPasswordDialog user={user} />}
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleDelete(user.id)}
                          className="text-muted-foreground hover:text-destructive"
                          title="Remove user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No users yet. Add your first team member above.
        </div>
      )}
    </div>
  );
}
