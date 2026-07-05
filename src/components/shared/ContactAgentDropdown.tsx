"use client";

import { useState } from "react";
import { Phone, MessageSquare, Mail, ChevronDown, ChevronUp } from "lucide-react";

interface ContactAgentDropdownProps {
  host: {
    id: string;
    name: string;
    phone: string;
    whatsapp?: string | null;
    email?: string | null;
  };
}

export function ContactAgentDropdown({ host }: ContactAgentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Strip non-digits from WhatsApp
  const rawDigits = host.whatsapp ? host.whatsapp.replace(/[^0-9]/g, "") : "";
  // Ensure Nigeria country code format: e.g. 234803...
  let formattedWhatsapp = rawDigits;
  if (rawDigits) {
    if (rawDigits.startsWith("0")) {
      formattedWhatsapp = "234" + rawDigits.substring(1);
    } else if (!rawDigits.startsWith("234")) {
      formattedWhatsapp = "234" + rawDigits;
    }
  }

  return (
    <div className="w-full bg-secondary rounded-2xl border border-border overflow-hidden transition-all duration-300 shadow-sm">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left focus:outline-none hover:bg-secondary/80 transition"
      >
        <div>
          <p className="text-sm font-bold text-foreground">Contact Agent</p>
          <p className="text-xs text-muted-foreground mt-0.5">Click to view contact details for {host.name}</p>
        </div>
        <div className="p-1.5 bg-card border border-border rounded-xl">
          {isOpen ? <ChevronUp className="w-4 h-4 text-foreground" /> : <ChevronDown className="w-4 h-4 text-foreground" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-border bg-card space-y-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-2">
            {/* Phone Option */}
            <a 
              href={`tel:${host.phone}`}
              className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/40 transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Mobile Phone</p>
                  <p className="text-[10px] text-muted-foreground">{host.phone || "Not provided"}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 hover:underline">Call Agent</span>
            </a>

            {/* WhatsApp Option */}
            {host.whatsapp ? (
              <a 
                href={`https://wa.me/${formattedWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">WhatsApp Chat</p>
                    <p className="text-[10px] text-muted-foreground">{host.whatsapp}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 hover:underline">Chat on WhatsApp</span>
              </a>
            ) : (
              <div className="p-3 rounded-xl border border-border bg-secondary/10 flex items-center justify-between text-muted-foreground">
                <div className="flex items-center gap-3 opacity-60">
                  <div className="p-2 bg-secondary rounded-lg">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">WhatsApp Chat</p>
                    <p className="text-[10px]">No WhatsApp contact provided</p>
                  </div>
                </div>
              </div>
            )}

            {/* App Message Option */}
            {host.id && (
              <a 
                href={`/member/messages?agentId=${host.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-secondary/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <Mail className="w-4 h-4 text-[#008A4B]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">In-App Chat</p>
                    <p className="text-[10px] text-muted-foreground">Send message on Neat & Affordable</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#008A4B] hover:underline">Message</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
