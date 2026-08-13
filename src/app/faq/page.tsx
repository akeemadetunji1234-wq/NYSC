import { PageTransition } from "../../components/layout/PageTransition";
import { HelpCircle, ShieldCheck, Home, Calendar, CreditCard } from "lucide-react";

export default function FAQPage() {
  const faqs = [
    {
      category: "For Corps Members",
      icon: Home,
      items: [
        {
          q: "How do I verify my NYSC status?",
          a: "During registration or via your profile settings, upload your valid NYSC Call-up Letter or ID card. Our verification team reviews submissions within 24 hours to grant verified corp member status.",
        },
        {
          q: "Are the listed apartments verified?",
          a: "Yes. All listings displayed with the 'Verified Agent' badge undergo physical or digital spot-checks. You can also inspect listing safety reports and read verified reviews from fellow corps members.",
        },
        {
          q: "How does the booking and payment process work?",
          a: "All bookings are securely handled through our escrow-protected reservation flow. Funds are held safely and only released to the agent after successful check-in confirmation.",
        },
      ],
    },
    {
      category: "For Agents & Hosts",
      icon: ShieldCheck,
      items: [
        {
          q: "How do I get the Verified Agent badge?",
          a: "Complete your identity KYC verification, provide proof of property ownership or management mandate, and maintain a high response and satisfaction rating.",
        },
        {
          q: "What are the service fees?",
          a: "We maintain transparent pricing with zero hidden charges. Agent commission structures are detailed clearly upon listing publication.",
        },
      ],
    },
  ];

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
              Everything you need to know about secure bookings, NYSC service year housing, and platform safety.
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div key={idx} className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Icon className="w-5 h-5 text-[#008A4B]" /> {section.category}
                  </h2>
                  <div className="space-y-6 divide-y divide-border">
                    {section.items.map((item, i) => (
                      <div key={i} className={i > 0 ? "pt-6" : ""}>
                        <h3 className="font-bold text-foreground text-base mb-2">{item.q}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
