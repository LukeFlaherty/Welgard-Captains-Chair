"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { UserPlus, Trash2, Loader2, ShieldCheck, Users, Wrench } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";

import { createUser, deleteUser, updateUserRole } from "@/actions/users";
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
});

type AddUserValues = z.infer<typeof addUserSchema>;

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  users: UserRow[];
  currentUserId: string;
};

export function UserManagement({ users: initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    defaultValues: { name: "", email: "", password: "", role: "team_member" },
  });

  const watchedRole = watch("role");

  // ── Add user ────────────────────────────────────────────────────────────────
  async function onAddUser(values: AddUserValues) {
    const result = await createUser({ ...values, name: values.name ?? "" });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.user) {
      setUsers((prev) => [...prev, result.user!]);
      toast.success(`${result.user.email} added successfully.`);
      reset();
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
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success("Role updated.");
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
      {/* Role legend */}
      <div className="flex flex-wrap gap-4 p-4 border rounded-xl bg-muted/30">
        {Object.entries(ROLE_LABELS).map(([role, label]) => {
          const Icon = ROLE_ICONS[role];
          return (
            <div key={role} className="flex flex-col gap-1">
              <RoleBadge role={role} />
              <p className="text-xs text-muted-foreground ml-1">
                {role === "admin" && "Full access + user management"}
                {role === "team_member" && "Full dashboard, no user settings"}
                {role === "vendor" && "Inspections only (submit & view)"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {users.length} {users.length === 1 ? "user" : "users"}
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button size="sm" className="gap-2" />}>
            <UserPlus className="w-4 h-4" />
            Add User
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add a new user</DialogTitle>
              <DialogDescription>
                Create an account and share the credentials with the team member.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(onAddUser)}
              className="flex flex-col gap-4 mt-2"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Jane Smith" {...register("name")} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@welgard.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">
                  Temporary Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Role <span className="text-destructive">*</span></Label>
                <Select
                  value={watchedRole}
                  onValueChange={(v) =>
                    setValue("role", v as AddUserValues["role"])
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin — full access</SelectItem>
                    <SelectItem value="team_member">Team Member — dashboard access</SelectItem>
                    <SelectItem value="vendor">Vendor — inspections only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isConfirmingDelete = deletingId === user.id;

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
                    {isSelf ? (
                      <RoleBadge role={user.role} />
                    ) : (
                      <Select
                        value={user.role}
                        onValueChange={(v) => v && handleRoleChange(user.id, v)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-40 h-7 text-xs">
                          <span className="flex-1 text-left">
                            {ROLE_LABELS[user.role] ?? user.role}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="team_member">Team Member</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDelete(user.id)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Remove user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
