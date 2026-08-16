"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, Phone, MessageSquare, Mail, ChevronDown, ChevronUp } from "lucide-react";

interface ContactAgentDropdownProps {
  host: {
    id: string;
    name: string;
    phone?: string | null;
    whatsapp?: string | null;
    verified?: boolean;
    verifiedAt?: Date | string | null;
  };
  viewerId?: string | null;
  listingTitle?: string;
  chatEnabled?: boolean;
}

export function ContactAgentDropdown({ host, viewerId, listingTitle, chatEnabled = true }: ContactAgentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rawDigits = host.whatsapp ? host.whatsapp.replace(/[^0-9]/g, "") : "";
  let formattedWhatsapp = rawDigits;
  if (rawDigits) {
    if (rawDigits.startsWith("0")) formattedWhatsapp = "234" + rawDigits.substring(1);
    else if (!rawDigits.startsWith("234")) formattedWhatsapp = "234" + rawDigits;
  }
  const canChat = Boolean(viewerId && chatEnabled);
  const whatsappHref = formattedWhatsapp
    ? `https://wa.me/${formattedWhatsapp}?text=${encodeURIComponent(`Hello ${host.name}, I’m interested in ${listingTitle || "your property"} on Neat & Affordable.`)}`
    : null;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm transition-all duration-300">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between p-4 text-left transition hover:bg-secondary/80 focus:outline-none" aria-expanded={isOpen}>
        <div>
          <p className="text-sm font-bold text-foreground">Contact Agent</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Choose WhatsApp or chat securely with {host.name}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-1.5">
          {isOpen ? <ChevronUp className="h-4 w-4 text-foreground" /> : <ChevronDown className="h-4 w-4 text-foreground" />}
        </div>
      </button>

      {isOpen && (
        <div className="animate-in slide-in-from-top-4 space-y-3 border-t border-border bg-card p-4 duration-300">
          {host.verified && (
            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
              <BadgeCheck className="h-4 w-4" />
              Verified agent{host.verifiedAt ? ` · ${new Date(host.verifiedAt).toLocaleDateString()}` : ""}
            </div>
          )}

          {host.phone ? (
            <a href={`tel:${host.phone}`} className="flex items-center justify-between rounded-xl border border-border p-3 transition hover:bg-secondary/40">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/20"><Phone className="h-4 w-4 text-blue-600" /></div>
                <div><p className="text-xs font-bold text-foreground">Mobile Phone</p><p className="text-[10px] text-muted-foreground">{host.phone}</p></div>
              </div>
              <span className="text-xs font-bold text-blue-600 hover:underline">Call Agent</span>
            </a>
          ) : null}

          {whatsappHref ? (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label={`Chat with ${host.name} on WhatsApp`} className="flex items-center justify-between rounded-xl border border-border p-3 transition hover:bg-secondary/40">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/20"><MessageSquare className="h-4 w-4 text-emerald-600" /></div>
                <div><p className="text-xs font-bold text-foreground">WhatsApp</p><p className="text-[10px] text-muted-foreground">Contact the agent directly</p></div>
              </div>
              <span className="text-xs font-bold text-emerald-600 hover:underline">Open WhatsApp</span>
            </a>
          ) : null}

          {canChat ? (
            <Link href={`/member/messages?agentId=${encodeURIComponent(host.id)}`} className="flex items-center justify-between rounded-xl border border-border p-3 transition hover:bg-secondary/40" aria-label={`Chat with ${host.name} on Neat & Affordable`}>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950/20"><Mail className="h-4 w-4 text-[#008A4B]" /></div>
                <div><p className="text-xs font-bold text-foreground">In-App Chat</p><p className="text-[10px] text-muted-foreground">Send a direct message to {host.name}</p></div>
              </div>
              <span className="text-xs font-bold text-[#008A4B] hover:underline">Message</span>
            </Link>
          ) : (
            <Link href={`/signin?callbackUrl=${encodeURIComponent(`/member/listing/${host.id}`)}`} className="flex items-center justify-between rounded-xl border border-border p-3 transition hover:bg-secondary/40">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950/20"><Mail className="h-4 w-4 text-[#008A4B]" /></div>
                <div><p className="text-xs font-bold text-foreground">In-App Chat</p><p className="text-[10px] text-muted-foreground">Sign in to message the agent</p></div>
              </div>
              <span className="text-xs font-bold text-[#008A4B] hover:underline">Sign in</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
