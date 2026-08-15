import { PageTransition } from "../../components/layout/PageTransition";
import { FileText } from "lucide-react";
import { getPublishedContentItems } from "../actions/cms";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const items = await getPublishedContentItems("TERMS");

  return (
    <PageTransition>
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-[#008A4B] rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">Published platform terms and policies.</p>
          </div>

          {items.length > 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
              {items.map((item) => (
                <section key={item.id} className="space-y-3 border-b border-border last:border-0 pb-6 last:pb-0">
                  <h2 className="text-lg font-bold text-foreground">{item.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.content}</p>
                </section>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6 text-sm text-muted-foreground leading-relaxed">
              <section className="space-y-3"><h2 className="text-lg font-bold text-foreground">1. Acceptance of Terms</h2><p>By accessing and using the Neat & Affordable NYSC Housing platform, you agree to comply with and be bound by these Terms of Service.</p></section>
              <section className="space-y-3"><h2 className="text-lg font-bold text-foreground">2. Accounts and Verification</h2><p>Users must provide accurate information. Corps members and agents may be subject to verification checks, and false credentials may result in suspension.</p></section>
              <section className="space-y-3"><h2 className="text-lg font-bold text-foreground">3. Booking Requests and Property Payments</h2><p>The platform creates and tracks booking or viewing request records, but it does not provide checkout for property rent, collect property funds, hold funds, or transfer funds between users. Corp Members and Agents must arrange and complete any property payment directly with each other after confirming the property and lease terms.</p></section>
              <section className="space-y-3"><h2 className="text-lg font-bold text-foreground">4. Prohibited Conduct</h2><p>Misleading listings, fraudulent transactions, unauthorized role escalation, and attempts to bypass security controls are prohibited.</p></section>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
