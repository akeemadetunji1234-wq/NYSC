import { PageTransition } from "../../components/layout/PageTransition";
import { ShieldCheck, AlertTriangle, PhoneCall } from "lucide-react";
import { getPublishedContentItems } from "../actions/cms";

export const dynamic = "force-dynamic";

export default async function SafetyPage() {
  const items = await getPublishedContentItems("SAFETY");

  return (
    <PageTransition>
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-[#008A4B] rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Safety & Trust</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Follow these guidelines when inspecting a listing, communicating with an agent, and completing a booking.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-card border border-border rounded-2xl p-5"><ShieldCheck className="w-5 h-5 text-[#008A4B] mb-3" /><h2 className="font-bold">Verify first</h2><p className="text-sm text-muted-foreground mt-2">Use verified listings and confirm the address before paying.</p></div>
            <div className="bg-card border border-border rounded-2xl p-5"><AlertTriangle className="w-5 h-5 text-amber-600 mb-3" /><h2 className="font-bold">Avoid off-platform pressure</h2><p className="text-sm text-muted-foreground mt-2">Do not send money or identity documents through an unverified channel.</p></div>
            <div className="bg-card border border-border rounded-2xl p-5"><PhoneCall className="w-5 h-5 text-blue-600 mb-3" /><h2 className="font-bold">Report concerns</h2><p className="text-sm text-muted-foreground mt-2">Use the listing report control or contact support when something feels wrong.</p></div>
          </div>

          {items.length > 0 ? (
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              {items.map((item) => (
                <article key={item.id} className="border-b border-border last:border-0 pb-6 last:pb-0">
                  <h2 className="text-lg font-bold text-foreground mb-2">{item.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.content}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
              Our safety team is updating this page. Please contact support before proceeding with an unusual request.
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
