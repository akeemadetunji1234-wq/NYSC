"use client";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Chukwuemeka O.",
    batch: "Batch B, 2024  Benue State",
    text: "Within 3 days of arriving at camp, I had already found, viewed, and secured my apartment through Neat & Affordable. The PPA distance estimator saved me so much stress!",
    rating: 5,
    avatar: "CO"
  },
  {
    name: "Fatima A.",
    batch: "Batch A, 2025  Rivers State",
    text: "I was skeptical at first, but the agent verification badge gave me peace of mind. My agent was professional and the apartment was exactly as described.",
    rating: 5,
    avatar: "FA"
  },
  {
    name: "Babatunde S.",
    batch: "Batch C, 2024 Lagos State",
    text: "Being a corper in Lagos without Neat & Affordable is a nightmare. This app made it so much easier — I could filter by electricity supply and PPA distance at the same time!",
    rating: 5,
    avatar: "BS"
  },
  {
    name: "Ngozi E.",
    batch: "Batch A, 2025 Kano State",
    text: "Moving from Enugu to Kano was scary, but Neat & Affordable helped me find a safe, affordable apartment near my PPA before I even left home. Highly recommend.",
    rating: 5,
    avatar: "NE"
  }
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-gray-50 py-24 px-5 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
            ILLUSTRATIVE EXAMPLES
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-5">
            Built around the real<br className="hidden md:block" /> service-year housing problem
          </h2>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">
            Example scenarios based on common corps-member housing challenges. They are not paid reviews or verified customer testimonials.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map(({ name, batch, text, rating, avatar }) => (
            <div key={name} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex gap-1 mb-5">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 text-base leading-relaxed mb-6 font-medium italic">&quot;{text}&quot;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008A4B] to-emerald-400 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                  {avatar}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{name}</div>
                  <div className="text-gray-500 text-xs">{batch}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
