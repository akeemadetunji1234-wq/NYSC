"use client";

import Link from "next/link";

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-gray-50 px-5 py-20 md:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          EARLY DAYS
        </div>
        <h2 className="mb-4 text-3xl font-black text-gray-900 md:text-4xl">
          Real reviews will show here
        </h2>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-gray-500">
          We are not showing paid or invented testimonials. As corps members and verified agents use the
          platform, genuine feedback will appear in this space.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/explore"
            className="rounded-xl bg-[#008A4B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#006e3c]"
          >
            Browse live lodges
          </Link>
          <Link
            href="/safety"
            className="rounded-xl border border-emerald-200 px-5 py-2.5 text-sm font-bold text-[#008A4B]"
          >
            Read safety tips
          </Link>
        </div>
      </div>
    </section>
  );
}
