import { PageTransition } from "../../components/layout/PageTransition";
import { ShieldAlert, CheckCircle, AlertTriangle, Lock } from "lucide-react";

export default function SafetyPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-[#008A4B] rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Safety & Trust Guidelines</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your security and peace of mind during your NYSC service year are our highest priorities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-[#008A4B] rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-foreground">Secure Escrow Payments</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Never pay agents outside our official booking portal. All payments are held safely in escrow and released only after you confirm move-in inspection.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-[#008A4B] rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-foreground">Verified Agent Badges</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Look for the Verified Agent badge and verified timestamp. Our agents undergo strict background checks and document verification.
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-foreground">Important Safety Tips for Corps Members</h2>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#008A4B] mt-2 shrink-0"></div>
                <span><strong>Inspect Before Full Settlement:</strong> Always attend scheduled physical or digital viewings before making long-term commitments.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#008A4B] mt-2 shrink-0"></div>
                <span><strong>Report Suspicious Listings:</strong> Use the 'Report Listing' button on any property page if you notice misleading pricing, duplicate photos, or unresponsive hosts.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#008A4B] mt-2 shrink-0"></div>
                <span><strong>Keep Communications On Platform:</strong> For launch, direct messaging is strictly monitored and secured to prevent off-platform fraud.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
