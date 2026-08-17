import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { MemberNavbar } from "../../components/layout/MemberNavbar";
import { ThemeProvider } from "../../components/ThemeProvider";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!role) redirect("/signin");
  if (role === "ADMIN") redirect("/admin");
  if (role === "AGENT") redirect("/agent");
  if (role !== "CORP") redirect("/signin");

  return (
    <ThemeProvider>
      <div className="na-shell min-h-screen font-sans flex flex-col">
        <MemberNavbar />
        <main className="na-enter flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
