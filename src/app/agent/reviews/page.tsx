"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import { PageTransition } from "../../../components/layout/PageTransition";
import { Star, MessageCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";

import { getAgentReviews, replyToReview } from "../../actions/agent";

export default function AgentReviewsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [isReplying, setIsReplying] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    async function fetchReviews() {
      if (!userId) return;
      const data = await getAgentReviews(userId);
      setReviews(data);
      setIsLoading(false);
    }
    fetchReviews();
  }, [userId]);

  const handleReply = async (reviewId: string) => {
    if (!replyText[reviewId]) return;
    setIsReplying(prev => ({ ...prev, [reviewId]: true }));
    await replyToReview(reviewId, replyText[reviewId]);
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: replyText[reviewId] } : r));
    setIsReplying(prev => ({ ...prev, [reviewId]: false }));
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Guest Reviews</h1>
          <p className="text-muted-foreground mt-1">See what corpers are saying about your properties.</p>
        </div>

        <div className="flex gap-6 items-center bg-card p-6 rounded-2xl border border-border shadow-sm">
           <div className="text-center pr-6 border-r border-border">
             <h2 className="text-5xl font-bold text-foreground">{avgRating}</h2>
             <div className="flex items-center gap-1 text-amber-400 mt-2 mb-1 justify-center">
               <Star className="w-5 h-5 fill-current" />
               <Star className="w-5 h-5 fill-current" />
               <Star className="w-5 h-5 fill-current" />
               <Star className="w-5 h-5 fill-current" />
               <Star className="w-5 h-5 fill-current" />
             </div>
             <p className="text-sm text-muted-foreground">{reviews.length} Total Reviews</p>
           </div>
           <div className="flex-1 space-y-2">
             {[5,4,3,2,1].map((star) => (
               <div key={star} className="flex items-center gap-2">
                 <span className="text-sm text-muted-foreground font-medium w-3">{star}</span>
                 <Star className="w-4 h-4 text-amber-400 fill-current" />
                 <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                   <div className="h-full bg-amber-400 rounded-full" style={{ width: star === 5 ? '80%' : star === 4 ? '15%' : '5%' }}></div>
                 </div>
               </div>
             ))}
           </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <p className="text-muted-foreground text-center">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground text-center">No reviews found.</p>
          ) : reviews.map((review) => (
            <div key={review.id} className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                    {(review.corpMember?.name || "G").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{review.corpMember?.name || "Guest"}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()} • {review.property?.title}</p>
                  </div>
                </div>
                <div className="flex items-center text-amber-400">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} />
                  ))}
                </div>
              </div>
              
              <p className="text-muted-foreground">{review.comment}</p>
              
              {review.reply ? (
                <div className="bg-secondary p-4 rounded-xl ml-8 border-l-4 border-blue-500">
                  <p className="text-xs font-bold text-foreground mb-1 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> Your Reply
                  </p>
                  <p className="text-sm text-muted-foreground">{review.reply}</p>
                </div>
              ) : (
                <div className="ml-8 mt-2 space-y-2">
                  <textarea 
                    value={replyText[review.id] || ""} 
                    onChange={e => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                    placeholder="Write a reply..." 
                    className="w-full border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    rows={2}
                  />
                  <Button 
                    onClick={() => handleReply(review.id)} 
                    disabled={!replyText[review.id] || isReplying[review.id]}
                    className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isReplying[review.id] ? "Replying..." : "Reply to Guest"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </PageTransition>
  );
}
