import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AuthProvider } from "../../components/auth/AuthProvider";
import AdminClientLayout from "./AdminClientLayout";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user) redirect("/signin");
  if (role !== "ADMIN") redirect("/member");

  return (
    <AuthProvider>
      <AdminClientLayout>{children}</AdminClientLayout>
    </AuthProvider>
  );
}
