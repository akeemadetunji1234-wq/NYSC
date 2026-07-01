"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { Building, Plus, Search, MapPin, Edit, Trash2, CalendarCheck } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { getAgentProperties, deleteProperty, updateProperty } from "../../actions/property";

export default function AgentPropertiesPage() {
  const { data: session, status } = useSession();
  const userId = (session?.user as any)?.id;

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || (status === "authenticated" && !userId)) {
      setLoading(false);
      return;
    }
    if (userId) {
      loadProperties();
    }
  }, [userId, status]);

  async function loadProperties() {
    if (!userId) return;
    try {
      const data = await getAgentProperties(userId);
      const formatted = data.map(p => ({
        id: p.id,
        name: p.title,
        location: p.location,
        price: `₦${p.price.toLocaleString()}`,
        status: p.status === "PUBLISHED" ? "Active" : p.status === "PENDING" ? "Pending" : "Draft",
        image: p.images[0] || "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=400",
        beds: p.bedrooms,
        baths: p.bathrooms,
        activeBookings: 0 // Mock bookings for now
      }));
      setProperties(formatted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    try {
      await deleteProperty(id);
      await loadProperties();
    } catch (error) {
      console.error("Failed to delete property:", error);
      alert("Failed to delete property.");
    }
  };

  const togglePropertyStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "DRAFT" : "PUBLISHED";
    try {
      await updateProperty(id, { status: newStatus } as any);
      setProperties(properties.map(p =>
        p.id === id ? { ...p, status: newStatus === "PUBLISHED" ? "Active" : "Inactive" } : p
      ));
    } catch (error) {
      console.error("Failed to toggle property status:", error);
      alert("Failed to update status.");
    }
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Properties</h1>
            <p className="text-muted-foreground mt-1">Manage your lodge listings and availability.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm" asChild>
            <Link href="/agent/properties/new">
              <Plus className="w-4 h-4 mr-2" /> Add New Property
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search properties..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
          </div>
          <select className="px-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-card">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden group hover:shadow-md transition flex flex-col">
              <div className="relative h-48 w-full overflow-hidden shrink-0">
                <Image src={property.image} alt={property.name} width={600} height={400} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold ${property.status === 'Active' ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}>
                  {property.status}
                </div>
                {/* Toggle Switch Overlay */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm cursor-pointer" onClick={(e) => { e.preventDefault(); togglePropertyStatus(property.id, property.status); }}>
                   <span className="text-xs font-bold text-muted-foreground">{property.status === 'Active' ? 'Listed' : 'Unlisted'}</span>
                   <div className={`w-8 h-4 rounded-full relative transition-colors ${property.status === 'Active' ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-card rounded-full transition-transform ${property.status === 'Active' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                   </div>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-foreground line-clamp-1">{property.name}</h3>
                    <p className="font-bold text-blue-600 whitespace-nowrap">{property.price}<span className="text-xs text-muted-foreground font-normal">/yr</span></p>
                  </div>
                  <p className="text-muted-foreground text-sm flex items-center gap-1 mb-4">
                    <MapPin className="w-4 h-4" /> {property.location}
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground border-t border-border pt-4 mt-auto">
                  <div className="flex items-center gap-2 font-medium"><Building className="w-4 h-4 text-slate-400"/> {property.beds} Rooms Total</div>
                  <div className="flex items-center gap-2 font-medium text-blue-700 bg-blue-50 w-max px-2 py-1 rounded-md"><CalendarCheck className="w-4 h-4"/> {property.activeBookings} Active Bookings</div>
                </div>
              </div>
              <div className="p-2 border-t border-border bg-secondary flex justify-between shrink-0">
                <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex-1 rounded-xl" asChild>
                  <Link href={`/agent/properties/${property.id}/edit`}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Link>
                </Button>
                <Button onClick={() => handleDelete(property.id)} variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 rounded-xl">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          ))}
          {loading && <div className="col-span-full py-10 text-center text-muted-foreground">Loading properties...</div>}
          {!loading && properties.length === 0 && (
            <div className="col-span-full py-10 text-center text-muted-foreground flex flex-col items-center">
              <p>You haven't added any properties yet.</p>
              {!userId && status === "authenticated" && (
                 <p className="text-red-500 text-xs mt-2">Error: User ID not found in session.</p>
              )}
            </div>
          )}
        </div>

      </div>
    </PageTransition>
  );
}
