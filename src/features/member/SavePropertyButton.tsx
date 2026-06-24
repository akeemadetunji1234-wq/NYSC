"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toggleSavedLodge } from "../../app/actions/member";
import { toast } from "sonner";

export function SavePropertyButton({ propertyId, initiallySaved, iconOnly = false }: { propertyId: string, initiallySaved: boolean, iconOnly?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(initiallySaved);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    const previousState = saved;
    // Optimistic update
    setSaved(!saved);
    toast.success(saved ? "Removed from Saved Lodges" : "Added to Saved Lodges");

    startTransition(async () => {
      try {
        const isSavedNow = await toggleSavedLodge(propertyId, "mock-corp-id");
        setSaved(isSavedNow);
      } catch (error) {
        // Revert on error
        setSaved(previousState);
        toast.error("Failed to update saved status.");
      }
    });
  };

  if (iconOnly) {
    return (
      <button 
        className={`absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full transition z-10 ${saved ? 'text-rose-500 hover:text-rose-600' : 'text-slate-400 hover:text-rose-500 hover:bg-white'}`}
        onClick={handleSave}
        disabled={isPending}
      >
        <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
      </button>
    );
  }

  return (
    <Button 
      variant="outline" 
      className={`rounded-full shadow-sm transition-colors ${saved ? 'text-rose-500 border-rose-200 bg-rose-50' : 'text-slate-700'}`}
      onClick={handleSave}
      disabled={isPending}
    >
      <Heart className={`w-4 h-4 mr-2 ${saved ? 'fill-current' : ''}`} /> 
      {saved ? 'Saved' : 'Save'}
    </Button>
  );
}
