import { PageTransition } from "../../components/layout/PageTransition";
import { ShieldCheck, AlertTriangle, PhoneCall, Eye, MessageSquareWarning, MapPin } from "lucide-react";
import { getPublishedContentItems } from "../actions/cms";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DEFAULT_GUIDES = [
  {
    title: "Before you visit a property",
    content:
      "Only schedule viewings through the platform when possible. Share the address with a trusted contact. Prefer daytime visits and meet the agent in a public place first if you feel uncertain. Confirm the listing is marked verified and matches photos and the stated location.",
  },
  {
    title: "Money and deposits",
    content:
      "Neat & Affordable does not hold rent or accommodation deposits. Never transfer large sums to an agent you have not met, and never pay solely because someone messaged you off-platform. Ask for a written receipt and clear terms. If pressure tactics appear (urgent same-day payment, refusal to show ID, refusal to meet at the property), stop and report the listing.",
  },
  {
    title: "Communication safety",
    content:
      "Keep early conversations in-app when you can. Avoid sending government ID scans, bank OTPs, or full call-up letter details to strangers. Legitimate agents do not need your NIN or BVN to show you a room.",
  },
  {
    title: "If something feels wrong",
    content:
      "Use the listing report control, leave the premises if you feel unsafe, and contact local emergency services when needed. Nigeria\u2019s national emergency number is 112. State-specific contacts in the app are labeled when verified; otherwise use the national fallback and your local police or NYSC officials.",
  },
];

export default async function SafetyPage() {
  const items = await getPublishedContentItems("SAFETY");
  const guides = items.length > 0
    ? items.map((item) => ({ title: item.title, content: item.content }))
    : DEFAULT_GUIDES;

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
              Practical guidance for inspecting listings, communicating with agents, and completing accommodation arrangements during your service year.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-card border border-border rounded-2xl p-5">
              <ShieldCheck className="w-5 h-5 text-[#008A4B] mb-3" />
              <h2 className="font-bold">Verify first</h2>
              <p className="text-sm text-muted-foreground mt-2">Prefer verified agents and confirm the address before paying anything.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <AlertTriangle className="w-5 h-5 text-amber-600 mb-3" />
              <h2 className="font-bold">Avoid off-platform pressure</h2>
              <p className="text-sm text-muted-foreground mt-2">Do not send money or identity documents through an unverified channel.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <PhoneCall className="w-5 h-5 text-blue-600 mb-3" />
              <h2 className="font-bold">Report concerns</h2>
              <p className="text-sm text-muted-foreground mt-2">Use the listing report control or contact support when something feels wrong.</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            {guides.map((item) => (
              <article key={item.title} className="border-b border-border last:border-0 pb-6 last:pb-0">
                <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                  {item.title === "Before you visit a property" ? <MapPin className="w-4 h-4 text-[#008A4B]" /> : null}
                  {item.title === "Communication safety" ? <Eye className="w-4 h-4 text-[#008A4B]" /> : null}
                  {item.title === "If something feels wrong" ? <MessageSquareWarning className="w-4 h-4 text-[#008A4B]" /> : null}
                  {item.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.content}</p>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
            <p className="font-semibold mb-1">Emergency</p>
            <p>
              For immediate danger, call <strong>112</strong> (national emergency). Platform safety check-ins and emergency contact lists are helpers, not a substitute for local emergency services.
            </p>
            <p className="mt-3">
              <Link href="/explore" className="font-bold text-[#008A4B] underline-offset-2 hover:underline">
                Browse verified listings
              </Link>
              {" \u00b7 "}
              <Link href="/faq" className="font-bold text-[#008A4B] underline-offset-2 hover:underline">
                FAQ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
