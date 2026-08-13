import { PageTransition } from "../../components/layout/PageTransition";
import { HelpCircle, ShieldCheck } from "lucide-react";
import { getPublishedContentItems } from "../actions/cms";

export const dynamic = "force-dynamic";

export default async function FAQPage() {
  const items = await getPublishedContentItems("FAQ");

  return (
    <PageTransition>
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-[#008A4B] rounded-2xl flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Answers about secure bookings, NYSC service-year housing, verification, and platform safety.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
              Our FAQ team is updating this page. Please contact support if you need help with a booking.
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="space-y-6 divide-y divide-border">
                {items.map((item) => (
                  <article key={item.id} className="first:pt-0 pt-6">
                    <h2 className="font-bold text-foreground text-base mb-2 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-[#008A4B]" />
                      {item.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.content}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
