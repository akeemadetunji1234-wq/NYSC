"use client";

import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-3xl shadow-xl border border-border text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-[#008A4B]"></div>
        
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
           <Search className="w-12 h-12 text-[#008A4B]" />
        </div>
        
        <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
        <h2 className="text-xl font-bold text-muted-foreground mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          Oops! It seems we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        
        <div className="space-y-3">
           <Button className="w-full bg-[#008A4B] hover:bg-[#006F3C] text-white py-6 rounded-xl font-bold flex items-center justify-center gap-2" asChild>
             <Link href="/">
               <Home className="w-5 h-5" /> Back to Home
             </Link>
           </Button>
           <Button variant="outline" className="w-full py-6 rounded-xl font-bold flex items-center justify-center gap-2" onClick={() => window.history.back()}>
             <ArrowLeft className="w-5 h-5" /> Go Back
           </Button>
        </div>
      </div>
    </div>
  );
}
