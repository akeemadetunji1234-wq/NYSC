export const dynamic = "force-dynamic";

import { prisma } from "../../../lib/prisma";
import { PageTransition } from "../../../components/layout/PageTransition";
import { MapPin, BedDouble, Bath, User, CheckCircle, XCircle, Clock } from "lucide-react";
import Image from "next/image";

async function getAllProperties() {
  return prisma.property.findMany({
    include: {
      agent: {
        select: { name: true, email: true, agentVerified: true }
      },
      bookings: { select: { id: true } }
    },
    orderBy: { createdAt: "desc" }
  });
}

const statusStyles: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  PENDING:   "bg-amber-100 text-amber-700",
  INACTIVE:  "bg-secondary text-muted-foreground",
};

const statusIcons: Record<string, any> = {
  PUBLISHED: CheckCircle,
  PENDING:   Clock,
  INACTIVE:  XCircle,
};

export default async function AdminPropertiesPage() {
  const properties = await getAllProperties();

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">All Properties</h1>
            <p className="text-muted-foreground mt-1">
              {properties.length} total listing{properties.length !== 1 ? "s" : ""} across all agents.
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total",     value: properties.length,                                          color: "bg-slate-800 text-white" },
            { label: "Published", value: properties.filter(p => p.status === "PUBLISHED").length,    color: "bg-green-600 text-white" },
            { label: "Pending",   value: properties.filter(p => p.status === "PENDING").length,      color: "bg-amber-500 text-white" },
            { label: "Draft",     value: properties.filter(p => p.status === "DRAFT").length,        color: "bg-slate-400 text-white" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${color} rounded-2xl p-4 flex flex-col gap-1`}>
              <p className="text-sm font-medium opacity-80">{label}</p>
              <p className="text-3xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Properties List */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {properties.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No properties listed yet.</p>
              <p className="text-sm mt-1">Verified agents can start adding listings.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {properties.map((property) => {
                const StatusIcon = statusIcons[property.status] ?? Clock;
                return (
                  <div key={property.id} className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-slate-50/50 transition">
                    {/* Image */}
                    <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden shrink-0 relative bg-secondary">
                      {property.images?.[0] ? (
                        <Image
                          src={property.images[0]}
                          alt={property.title}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-base line-clamp-1">{property.title}</h3>
                      <p className="text-muted-foreground text-sm flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {property.location}, {property.lga}, {property.state}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {property.bedrooms} Beds</span>
                        <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {property.bathrooms} Baths</span>
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {property.agent?.name || "Unknown Agent"}</span>
                        {!property.agent?.agentVerified && (
                          <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">Agent Unverified</span>
                        )}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-base font-bold text-foreground">₦{property.price.toLocaleString()}<span className="text-xs text-slate-400 font-normal">/yr</span></p>
                      <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${statusStyles[property.status] ?? "bg-secondary text-muted-foreground"}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {property.status}
                      </span>
                      <p className="text-xs text-slate-400">{property.bookings.length} booking{property.bookings.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
