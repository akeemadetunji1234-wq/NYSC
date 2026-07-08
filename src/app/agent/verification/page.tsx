"use client";

import { useSession } from "next-auth/react";
import { PageTransition } from "../../../components/layout/PageTransition";
import { BadgeCheck, Shield, CheckCircle, Upload, XCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";

export default function VerifiedBadgePage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isVerified = user?.agentVerified || false;
  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border shadow-inner ${isVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <BadgeCheck className={`w-10 h-10 ${isVerified ? 'text-emerald-500' : 'text-amber-500'}`} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {isVerified ? "You are a Verified Agent!" : "Verified Agent Status"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Stand out to prospective tenants by verifying your identity and agency credentials. Verified agents receive up to 3x more bookings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Status Panel */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-6">Verification Status</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Email Address</h4>
                  <p className="text-sm text-muted-foreground">Verified on sign up</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {isVerified ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Government ID</h4>
                  <p className="text-sm text-muted-foreground mb-3">Upload a valid driver's license, passport, or NIN slip.</p>
                  {!isVerified && (
                    <Button variant="outline" className="text-sm shadow-sm font-medium">
                      <Upload className="w-4 h-4 mr-2" /> Upload ID
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {isVerified ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Agency CAC Document</h4>
                  <p className="text-sm text-muted-foreground mb-3">Upload your corporate affairs commission certificate if applicable.</p>
                  {!isVerified && (
                    <Button variant="outline" className="text-sm shadow-sm font-medium">
                      <Upload className="w-4 h-4 mr-2" /> Upload Document
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Panel */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl text-white">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-bold">Verification Benefits</h2>
            </div>
            
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="p-1 bg-white/10 rounded-full"><BadgeCheck className="w-4 h-4 text-amber-400" /></div>
                <span className="text-sm font-medium text-slate-200">Exclusive Verified Badge on all your listings</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1 bg-white/10 rounded-full"><BadgeCheck className="w-4 h-4 text-amber-400" /></div>
                <span className="text-sm font-medium text-slate-200">Higher ranking in default search results</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1 bg-white/10 rounded-full"><BadgeCheck className="w-4 h-4 text-amber-400" /></div>
                <span className="text-sm font-medium text-slate-200">Increased trust and conversion rate from corpers</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
