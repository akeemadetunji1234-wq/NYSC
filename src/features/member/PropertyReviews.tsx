"use client";

import { useState } from "react";
import { Star, Send, CheckCircle, ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui/button";
import { createReview } from "../actions/member";
import { toast } from "sonner";
import Image from "next/image";

interface Review {
  id: string;
  rating: number;
  comment: string;
  reply?: string | null;
  createdAt: Date;
  corpMember: {
    id: string;
    name: string | null;
    image: string | null;
    batch: string | null;
  };
}

interface PropertyReviewsProps {
  propertyId: string;
  reviews: Review[];
  userId: string | null;
  canReview: boolean; // true if user has a completed/accepted booking
  hasAlreadyReviewed: boolean;
}

function StarRatingPicker({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hovered || rating)
                ? "text-amber-400 fill-amber-400"
                : "text-slate-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function PropertyReviews({
  propertyId,
  reviews: initialReviews,
  userId,
  canReview,
  hasAlreadyReviewed,
}: PropertyReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(hasAlreadyReviewed);

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    if (!comment.trim()) { toast.error("Please write a comment."); return; }
    if (!userId) { toast.error("You must be signed in to leave a review."); return; }

    setIsSubmitting(true);
    try {
      const review = await createReview({ propertyId, corpMemberId: userId, rating, comment });
      toast.success("Review submitted! Thank you 🎉");
      setSubmitted(true);
      setReviews(prev => [{
        ...review,
        corpMember: { id: userId, name: "You", image: null, batch: null }
      } as any, ...prev]);
    } catch (err: any) {
      if (err.message === "ALREADY_REVIEWED") {
        toast.error("You've already reviewed this property.");
        setSubmitted(true);
      } else {
        toast.error("Failed to submit review. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div className="text-center shrink-0">
            <p className="text-6xl font-bold text-slate-900">{avgRating.toFixed(1)}</p>
            <div className="flex items-center justify-center gap-0.5 my-2">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
              ))}
            </div>
            <p className="text-sm text-slate-500 font-medium">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
          </div>
          <div className="flex-1 w-full space-y-1.5">
            {ratingCounts.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 w-3">{star}</span>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Form */}
      {userId && canReview && !submitted && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <h4 className="font-bold text-slate-900">Leave a Review</h4>
            <p className="text-xs text-slate-500 mt-0.5">Share your experience to help other Corp members</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Your Rating</label>
              <StarRatingPicker rating={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-sm font-semibold text-amber-600 mt-2">{ratingLabels[rating]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Your Review</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="How was your experience? Was the agent responsive? Was the property as described?"
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A4B]/30 focus:border-[#008A4B] resize-none transition"
              />
              <p className="text-xs text-slate-400 mt-1">{comment.length}/500 characters</p>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="bg-[#008A4B] hover:bg-[#006F3C] text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </div>
      )}

      {/* Already reviewed */}
      {submitted && canReview && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-[#008A4B] shrink-0" />
          <p className="text-sm font-medium text-green-800">You've already reviewed this property. Thank you!</p>
        </div>
      )}

      {/* Not eligible yet */}
      {userId && !canReview && (
        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
          <p className="text-sm text-slate-600">
            Only Corp members with a confirmed booking can leave a review.{" "}
            <span className="font-semibold text-slate-700">Book this property first.</span>
          </p>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
          <Star className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">No reviews yet</p>
          <p className="text-sm text-slate-400 mt-1">Be the first to leave a review!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map(review => (
            <div key={review.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
              {/* Reviewer Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#008A4B] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                    {review.corpMember.image ? (
                      <Image src={review.corpMember.image} alt={review.corpMember.name || "User"} width={40} height={40} className="object-cover" />
                    ) : (
                      (review.corpMember.name || "C").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{review.corpMember.name || "Corp Member"}</p>
                    <p className="text-xs text-slate-400">
                      {review.corpMember.batch && <span className="mr-2">{review.corpMember.batch}</span>}
                      {new Date(review.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                  ))}
                </div>
              </div>

              {/* Comment */}
              <p className="text-slate-700 text-sm leading-relaxed">{review.comment}</p>

              {/* Agent Reply */}
              {review.reply && (
                <div className="ml-4 pl-4 border-l-4 border-[#008A4B] bg-green-50 rounded-r-xl p-3">
                  <p className="text-xs font-bold text-[#008A4B] mb-1">Response from Agent</p>
                  <p className="text-sm text-slate-600">{review.reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
