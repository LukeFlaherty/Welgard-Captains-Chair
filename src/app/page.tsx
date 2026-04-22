import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const stack = [
  { name: "Next.js 16", desc: "App Router · Turbopack · Server Actions" },
  { name: "React 19", desc: "Server Components · use() · Transitions" },
  { name: "Tailwind v4", desc: "CSS-first config · OKLCH color system" },
  { name: "shadcn/ui v4", desc: "Accessible · Composable · Unstyled" },
  { name: "TanStack Query v5", desc: "Async state · Suspense-ready" },
  { name: "Zustand v5", desc: "Lightweight global state · devtools" },
  { name: "next-safe-action v8", desc: "Type-safe server actions + Zod" },
  { name: "Zod v4", desc: "Schema validation · Type inference" },
  { name: "Vercel Analytics", desc: "Web vitals · Speed Insights" },
];

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-12 px-6 py-24">
      <section className="flex flex-col items-center gap-4 text-center max-w-2xl">
        <Badge variant="secondary" className="text-xs tracking-wider uppercase">
          PRD-Ready Stack
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight">
          {siteConfig.name}
        </h1>
        <p className="text-muted-foreground text-lg">
          Next.js 16 · React 19 · Tailwind v4 · shadcn/ui v4
          <br />
          Deployed on Vercel — ready to build.
        </p>
        <div className="flex gap-3 mt-2">
          <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
            Open Dashboard
          </Link>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Docs
          </a>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
        {stack.map((item) => (
          <Card key={item.name} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
