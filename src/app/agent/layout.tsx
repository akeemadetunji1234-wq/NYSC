import { AgentSidebar } from "../../components/layout/AgentSidebar";
import { AgentTopBar } from "../../components/layout/AgentTopBar";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-secondary flex flex-col md:flex-row font-sans">
      <AgentSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AgentTopBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
