import { AgentVerificationList } from "../../../features/admin/AgentVerificationList";
import { AdminMetrics } from "../../../features/admin/AdminMetrics";
import { PageTransition } from "../../../components/layout/PageTransition";

export default function VerificationPage() {
  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Agent Verification Queue
          </h1>
          <p className="text-slate-500 mt-1">
            Review and verify incoming agent applications.
          </p>
        </div>
        <AgentVerificationList />
        <AdminMetrics />
      </div>
    </PageTransition>
  );
}
