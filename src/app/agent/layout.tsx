import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { AgentSidebar } from "../../components/layout/AgentSidebar";
import { AgentTopBar } from "../../components/layout/AgentTopBar";
import { ThemeProvider } from "../../components/ThemeProvider";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!role) redirect("/signin");
  if (role === "ADMIN") redirect("/admin");
  if (role !== "AGENT") redirect("/member");

  return (
    <ThemeProvider storageKey="theme-agent">
      <div className="min-h-screen bg-secondary flex flex-col md:flex-row font-sans">
        <AgentSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AgentTopBar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
