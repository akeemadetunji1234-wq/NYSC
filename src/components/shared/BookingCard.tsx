import React from 'react';
import { Button } from '../ui/button';
import { MapPin, Star, BedDouble, Bath, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Property {
  id: string;
  title: string;
  location: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  imageUrl: string;
  guests: number;
  bedrooms: number;
  bathrooms: number;
}

interface BookingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  property?: Property;
  isLoading?: boolean;
  onBook?: (id: string) => void;
}

export function BookingCard({
  property,
  isLoading = false,
  className,
  onBook,
  ...props
}: BookingCardProps) {
  if (isLoading) {
    return (
      <div className={cn("rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm flex flex-col h-full animate-pulse", className)} {...props}>
        <div className="w-full h-48 bg-gray-200" />
        <div className="p-5 flex flex-col flex-grow gap-4">
          <div className="space-y-2">
            <div className="h-6 w-3/4 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
          </div>
          <div className="flex gap-4">
            <div className="h-4 w-12 bg-gray-200 rounded" />
            <div className="h-4 w-12 bg-gray-200 rounded" />
          </div>
          <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
            <div className="h-6 w-1/3 bg-gray-200 rounded" />
            <div className="h-10 w-24 bg-gray-200 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className={cn("rounded-xl overflow-hidden border border-gray-200 border-dashed bg-gray-50 flex items-center justify-center h-64", className)} {...props}>
        <p className="text-gray-500 font-medium">Property unavailable</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group", className)} {...props}>
      <div className="relative w-full h-48 overflow-hidden">
        <img 
          src={property.imageUrl} 
          alt={property.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-sm font-semibold shadow-sm">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span>{property.rating}</span>
          <span className="text-gray-500 text-xs font-normal">({property.reviews})</span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-1" title={property.title}>
            {property.title}
          </h3>
        </div>
        
        <div className="flex items-center text-gray-500 text-sm mb-4">
          <MapPin className="w-4 h-4 mr-1 shrink-0" />
          <span className="truncate">{property.location}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 flex-wrap">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-gray-400" />
            <span>{property.guests} Guests</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BedDouble className="w-4 h-4 text-gray-400" />
            <span>{property.bedrooms} Beds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="w-4 h-4 text-gray-400" />
            <span>{property.bathrooms} Baths</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold">${property.pricePerNight}</span>
            <span className="text-gray-500 text-sm">/ night</span>
          </div>
          <Button onClick={() => onBook?.(property.id)}>
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
}
