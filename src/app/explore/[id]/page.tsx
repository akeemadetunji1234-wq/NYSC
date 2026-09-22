import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Home, MapPin, ShieldCheck } from "lucide-react";
import { getPropertyById } from "../../actions/property";

export const dynamic = "force-dynamic";

export default async function PublicListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) notFound();

  let property;
  try {
    property = await getPropertyById(id);
  } catch {
    notFound();
  }

  if (!property || property.status !== "PUBLISHED") notFound();

  return (
    <div className="min-h-screen bg-[#f6f8f6] text-slate-900">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-8">
          <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#008A4B]">
            <ArrowLeft className="h-4 w-4" /> Back to listings
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#008A4B]">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="font-black">Neat & Affordable</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-8">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="relative h-72 bg-slate-100 md:h-96">
            {property.images[0] ? (
              <Image src={property.images[0]} alt={property.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                <Home className="h-16 w-16" />
              </div>
            )}
          </div>
          <div className="space-y-4 p-6 md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-black">{property.title}</h1>
                <p className="mt-2 flex items-center gap-1 text-slate-500">
                  <MapPin className="h-4 w-4" />
                  {property.lga ? `${property.lga}, ` : ""}{property.state || property.location}
                </p>
              </div>
              <p className="text-2xl font-black text-[#008A4B]">
                ₦{property.price.toLocaleString()}
                <span className="text-sm font-medium text-slate-400"> /yr</span>
              </p>
            </div>

            {property.agent?.agentVerified && (
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" /> Verified agent
              </div>
            )}

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{property.description}</p>

            {property.amenities?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <span key={amenity} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {amenity}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-6">
          <h2 className="text-lg font-bold">Want to view this lodge?</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in as a corps member to chat with the agent, estimate commute to your PPA, and request a viewing. We never collect rent through the app.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/signin?callbackUrl=${encodeURIComponent(`/member/listing/${property.id}`)}`} className="rounded-xl bg-[#008A4B] px-5 py-2.5 text-sm font-bold text-white">
              Sign in to contact agent
            </Link>
            <Link href="/signup" className="rounded-xl border border-emerald-200 px-5 py-2.5 text-sm font-bold text-[#008A4B]">
              Create free account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
