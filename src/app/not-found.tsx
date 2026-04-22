import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-6">
      <p className="text-7xl font-bold tracking-tighter text-muted-foreground">
        404
      </p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className={buttonVariants()}>
        Back home
      </Link>
    </main>
  );
}
