import { PageTransition } from "../../components/layout/PageTransition";
import { Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-[#008A4B] rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Last updated: August 2026
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">1. Information We Collect</h2>
              <p>
                We collect personal information necessary for secure housing verification and bookings, including your name, email, phone number, NYSC verification documents, and payment details.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">2. How We Protect Your Data</h2>
              <p>
                We implement robust security controls including explicit database projections, encrypted session validation, rate limiting, and strict server-side access controls to ensure your private data is never leaked or exposed.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">3. Data Sharing</h2>
              <p>
                We do not sell or rent your personal information to third parties. Data is only shared with verified agents as necessary to complete your confirmed booking or scheduled viewing.
              </p>
            </section>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
