import Link from "next/link";
import { PageTransition } from "../../components/layout/PageTransition";
import { HelpCircle, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

const STATIC_FAQS: { title: string; content: string }[] = [
  {
    title: "Who pays the rent?",
    content:
      "You pay rent directly to the agent or landlord outside this app. Neat & Affordable does not collect, hold, or escrow rent for property stays.",
  },
  {
    title: "Do you hold money or act as escrow?",
    content:
      "No. Booking records and chat help you coordinate viewings and agreements. Money for rent moves between you and the agent directly — not through the platform.",
  },
  {
    title: "How does agent verification work?",
    content:
      "Agents submit identity documents for review. Administrators check applications before an agent can publish listings. Look for the verified agent badge on listings and profiles.",
  },
  {
    title: "How do viewings work?",
    content:
      "After you create a corps member account, open a listing and request a viewing. The agent confirms a time. Meet in a safe, public place when possible and never send deposits to unknown accounts before you have seen the property.",
  },
  {
    title: "How do I report a listing or agent?",
    content:
      "Signed-in users can report a listing from the property page. Use the in-app report flow and include clear details. For immediate danger, contact local emergency services — see our Safety page.",
  },
  {
    title: "What is the difference between Corp Member and Agent accounts?",
    content:
      "Corps members browse, save, chat, and request viewings. Agents list properties, manage enquiries, and complete verification before publishing. Choose the correct role at signup.",
  },
  {
    title: "What does PPA distance mean?",
    content:
      "Where location data is available, we help you estimate how far a lodge is from your Place of Primary Assignment (PPA). Always confirm routes and travel time yourself before paying.",
  },
  {
    title: "What are power ratings on listings?",
    content:
      "Agents may tag amenities related to electricity (for example generator or inverter). Treat these as claims to verify during a viewing — power supply varies by area and building.",
  },
  {
    title: "Can I browse without creating an account?",
    content:
      "Yes. You can search and open public listings as a guest. An account is only required to chat, save homes, request viewings, or report issues.",
  },
  {
    title: "How is my account secured?",
    content:
      "Use a strong unique password and keep your email access secure. Administrators use extra verification for sensitive actions. Never share one-time codes or passwords with anyone claiming to be support.",
  },
  {
    title: "What if a listing looks fake?",
    content:
      "Do not pay. Report the listing in-app, compare photos carefully, and insist on a physical viewing. Prefer verified agents and walk away from pressure to pay urgently.",
  },
  {
    title: "Where can I read safety guidance?",
    content:
      "See our Safety page for practical tips during viewings and service year. For platform questions, start with Browse homes or create an account to contact support through official in-app channels only.",
  },
];

export default function FAQPage() {
  // Always show curated static FAQs. CMS placeholders previously overrode this with
  // "Our FAQ team is updating this page" and broke trust on production.
  const items = STATIC_FAQS;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-[#008A4B]">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Straight answers about rent, verification, viewings, and safety. We do not hold rent on this platform.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm font-semibold">
              <Link href="/explore" className="text-[#008A4B] hover:underline">
                Browse homes
              </Link>
              <span className="text-muted-foreground">·</span>
              <Link href="/safety" className="text-[#008A4B] hover:underline">
                Safety guidance
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="divide-y divide-border space-y-0">
              {items.map((item) => (
                <article key={item.title} className="py-6 first:pt-0 last:pb-0">
                  <h2 className="mb-2 flex items-start gap-2 text-base font-bold text-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#008A4B]" />
                    {item.title}
                  </h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{item.content}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
