import { PageTransition } from "../../components/layout/PageTransition";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-[#008A4B] rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Last updated: August 2026
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the Neat & Affordable NYSC Housing platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform or services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">2. User Accounts and Verification</h2>
              <p>
                Users must provide accurate, current, and complete information during registration. Corps members and agents are subject to verification checks. Account sharing or providing false credentials will result in immediate suspension.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">3. Booking and Escrow Policy</h2>
              <p>
                All bookings must be completed through our secure platform. Payments are processed securely and protected by our escrow system until check-in confirmation is verified.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">4. Prohibited Conduct</h2>
              <p>
                Users are strictly prohibited from posting misleading listings, engaging in fraudulent transactions, attempting unauthorized role escalation, or bypassing security controls.
              </p>
            </section>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
