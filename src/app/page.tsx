import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function RootPage() {
  const session = await auth();
  const role = session?.user?.role ?? "vendor";
  redirect(role === "vendor" ? "/service-tickets" : "/inspections");
}
