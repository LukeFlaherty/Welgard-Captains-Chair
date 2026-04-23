"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  });

  async function onSubmit(values: FormValues) {
    setAuthError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError("Invalid email or password.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Brand bar */}
      <div className="flex items-center justify-center py-8 bg-primary">
        <Image
          src="/welgard-logos/wg-logo-white-on-blue-bg.webp"
          alt="Welgard"
          width={120}
          height={120}
          className="rounded-xl"
          priority
        />
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm shadow-md">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-2">
              <div className="rounded-full bg-primary/10 p-2.5">
                <Lock className="w-5 h-5 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Captain&apos;s Chair — Internal Ops Dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@welgard.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              {authError && (
                <p className="text-sm text-destructive text-center rounded-md bg-destructive/10 px-3 py-2">
                  {authError}
                </p>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full gap-2 mt-1">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-6">
        Internal Ops Dashboard · v1
      </p>
    </div>
  );
}
