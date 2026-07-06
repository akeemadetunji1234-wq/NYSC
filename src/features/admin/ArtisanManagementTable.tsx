"use client";

import { useState } from "react";
import { Search, Plus, Trash2, Edit, CheckCircle2, XCircle, Settings, ShieldAlert, Star } from "lucide-react";
import { createArtisan, updateArtisan, deleteArtisan, verifyArtisan } from "../../app/actions/admin";

type Artisan = {
  id: string;
  name: string;
  trade: string;
  state: string;
  lga: string;
  phone: string;
  rating: number;
  verified: boolean;
  createdAt: Date;
};

export function ArtisanManagementTable({ initialArtisans }: { initialArtisans: Artisan[] }) {
  const [artisans, setArtisans] = useState<Artisan[]>(initialArtisans);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    id: "",
    name: "",
    trade: "Plumber",
    state: "Lagos",
    lga: "Ikeja",
    phone: "",
    rating: 5.0,
    verified: false,
  });

  const filtered = artisans.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.trade.toLowerCase().includes(search.toLowerCase()) ||
    a.state.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    setLoading(true);
    try {
      if (form.id) {
        const updated = await updateArtisan(form.id, {
          name: form.name,
          trade: form.trade,
          state: form.state,
          lga: form.lga,
          phone: form.phone,
          rating: form.rating,
          verified: form.verified,
        });
        setArtisans(prev => prev.map(a => a.id === form.id ? updated : a));
      } else {
        const created = await createArtisan(form);
        setArtisans([created, ...artisans]);
      }
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert("Failed to save artisan.");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this artisan?")) return;
    setLoading(true);
    await deleteArtisan(id);
    setArtisans(prev => prev.filter(a => a.id !== id));
    setLoading(false);
  };

  const handleToggleVerify = async (id: string, currentStatus: boolean) => {
    setLoading(true);
    await verifyArtisan(id, !currentStatus);
    setArtisans(prev => prev.map(a => a.id === id ? { ...a, verified: !currentStatus } : a));
    setLoading(false);
  };

  const openEdit = (artisan: Artisan) => {
    setForm({
      id: artisan.id,
      name: artisan.name,
      trade: artisan.trade,
      state: artisan.state,
      lga: artisan.lga,
      phone: artisan.phone,
      rating: artisan.rating,
      verified: artisan.verified,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setForm({ id: "", name: "", trade: "Plumber", state: "Lagos", lga: "Ikeja", phone: "", rating: 5.0, verified: false });
    setShowModal(true);
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative">
      {loading && (
        <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
          <div className="w-8 h-8 border-4 border-[#008A4B] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Artisan Directory</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage verified maintenance workers.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search artisans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-secondary text-sm focus:outline-none focus:border-[#008A4B]"
            />
          </div>
          <button
            onClick={openCreate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#008A4B] text-white rounded-xl text-sm font-semibold hover:bg-[#00703C] transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Artisan
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-secondary/50 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4">Artisan Name</th>
              <th className="px-6 py-4">Trade</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No artisans found. Add one to get started.
                </td>
              </tr>
            ) : (
              filtered.map((artisan) => (
                <tr key={artisan.id} className="hover:bg-secondary/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
                        {artisan.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{artisan.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-xs text-muted-foreground">{artisan.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md bg-secondary text-xs font-medium text-foreground">
                      {artisan.trade}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">{artisan.lga}</p>
                    <p className="text-xs text-muted-foreground">{artisan.state}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-foreground">{artisan.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleVerify(artisan.id, artisan.verified)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                        artisan.verified
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      {artisan.verified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {artisan.verified ? "Verified" : "Unverified"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(artisan)}
                        className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(artisan.id)}
                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-2xl border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">
                {form.id ? "Edit Artisan" : "Add New Artisan"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-muted-foreground hover:bg-secondary rounded-full">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary text-sm focus:outline-none focus:border-[#008A4B]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Trade</label>
                  <select
                    value={form.trade}
                    onChange={e => setForm({ ...form, trade: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary text-sm focus:outline-none focus:border-[#008A4B]"
                  >
                    {["Plumber", "Electrician", "Carpenter", "Painter", "AC Technician", "Cleaner"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={form.rating}
                    onChange={e => setForm({ ...form, rating: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary text-sm focus:outline-none focus:border-[#008A4B]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">State</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={e => setForm({ ...form, state: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary text-sm focus:outline-none focus:border-[#008A4B]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">LGA / Area</label>
                  <input
                    type="text"
                    value={form.lga}
                    onChange={e => setForm({ ...form, lga: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary text-sm focus:outline-none focus:border-[#008A4B]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 0801 234 5678"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary text-sm focus:outline-none focus:border-[#008A4B]"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSave}
                  className="w-full py-3 bg-[#008A4B] text-white rounded-xl font-bold hover:bg-[#00703C] transition-colors"
                >
                  {form.id ? "Save Changes" : "Create Artisan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
