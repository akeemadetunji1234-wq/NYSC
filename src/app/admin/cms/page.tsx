"use client";

import { PageTransition } from "../../../components/layout/PageTransition";
import { FileText, Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useState, useEffect } from "react";
import { getContentItems, upsertContentItem, deleteContentItem } from "../../actions/cms";
import { toast } from "sonner";

export default function AdminCMSPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("FAQ");
  const [content, setContent] = useState("");
  const [isNew, setIsNew] = useState(false);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const data = await getContentItems();
      setItems(data);
    } catch (err) {
      toast.error("Failed to load content items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim() || !title.trim() || !content.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      await upsertContentItem({ slug, title, category, content, published: true });
      toast.success("Content saved successfully!");
      setEditingId(null);
      setIsNew(false);
      setSlug("");
      setTitle("");
      setContent("");
      await loadContent();
    } catch (err: any) {
      toast.error(err.message || "Failed to save content");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content item?")) return;
    try {
      await deleteContentItem(id);
      toast.success("Content item deleted.");
      await loadContent();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setSlug(item.slug);
    setTitle(item.title);
    setCategory(item.category);
    setContent(item.content);
    setIsNew(false);
  };

  const handleAddNew = () => {
    setEditingId("new");
    setSlug("");
    setTitle("");
    setCategory("FAQ");
    setContent("");
    setIsNew(true);
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#008A4B]" /> CMS & Content Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage FAQs, safety guidelines, transport guides, and announcements instantly without code deployments.</p>
          </div>
          <Button onClick={handleAddNew} className="bg-[#008A4B] hover:bg-[#00703C] text-white gap-2">
            <Plus className="w-4 h-4" /> Add New Content
          </Button>
        </div>

        {/* Edit / Create Form Modal or Card */}
        {editingId !== null && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-md space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-lg font-bold text-foreground">
                {isNew ? "Create New Content Item" : "Edit Content Item"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Slug (URL identifier)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. safety-tips-batch-a"
                    required
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Content Title"
                    required
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]"
                  >
                    <option value="FAQ">FAQ</option>
                    <option value="SAFETY">Safety Guide</option>
                    <option value="BLOG">Blog / News</option>
                    <option value="TERMS">Terms & Policy</option>
                    <option value="TRANSPORT">Transport Guide (JSON)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Content (Markdown / Text)</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={category === "TRANSPORT" ? '{"state":"Lagos","routes":[{"from":"Ikeja","to":"Yaba","fare":"₦..."}]}' : "Enter detailed content here..."}
                  rows={6}
                  required
                  className="w-full bg-secondary border border-border rounded-xl p-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[#008A4B]"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#008A4B] hover:bg-[#00703C] text-white gap-2">
                  <Save className="w-4 h-4" /> Save & Publish
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Content List */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary font-bold text-sm text-foreground">
            Published Content Items ({items.length})
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              <p className="p-8 text-center text-muted-foreground text-sm">Loading content items...</p>
            ) : items.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground text-sm">No content items found. Click 'Add New Content' to create one.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-secondary/30 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {item.category}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">slug: {item.slug}</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.content}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="gap-1 text-xs">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)} className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
