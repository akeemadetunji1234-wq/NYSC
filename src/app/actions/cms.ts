"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requireRole } from "../../lib/authGuard";
import { writeAuditLog } from "../../lib/audit";

const contentInputSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, "Slug may contain lowercase letters, numbers, and hyphens only"),
  title: z.string().trim().min(1).max(200),
  category: z.enum(["FAQ", "SAFETY", "BLOG", "TERMS"]),
  content: z.string().trim().min(1).max(50_000),
  published: z.boolean().optional(),
});

const idSchema = z.string().trim().min(1).max(100);

export async function getPublishedContentItems(category?: string) {
  const safeCategory = category ? z.enum(["FAQ", "SAFETY", "BLOG", "TERMS"]).parse(category) : undefined;
  try {
    return await prisma.contentItem.findMany({
      where: { published: true, ...(safeCategory ? { category: safeCategory } : {}) },
      orderBy: { updatedAt: "desc" },
      select: { id: true, slug: true, title: true, category: true, content: true, updatedAt: true },
    });
  } catch (error) {
    console.error("Published CMS content is unavailable:", error);
    return [];
  }
}

export async function getContentItems() {
  await requireRole("ADMIN");
  return prisma.contentItem.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, slug: true, title: true, category: true, content: true, published: true, createdAt: true, updatedAt: true },
  });
}

export async function upsertContentItem(input: unknown) {
  await requireRole("ADMIN");
  const parsed = contentInputSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid content details");

  const item = await prisma.contentItem.upsert({
    where: { slug: parsed.data.slug },
    update: {
      title: parsed.data.title,
      category: parsed.data.category,
      content: parsed.data.content,
      published: parsed.data.published ?? true,
    },
    create: {
      slug: parsed.data.slug,
      title: parsed.data.title,
      category: parsed.data.category,
      content: parsed.data.content,
      published: parsed.data.published ?? true,
    },
    select: { id: true, slug: true, title: true, category: true, published: true, updatedAt: true },
  });

  await writeAuditLog("CMS_CONTENT_SAVED", item.id, `Content item saved: ${item.slug}`);
  revalidatePath("/faq");
  revalidatePath("/safety");
  revalidatePath("/terms");
  revalidatePath("/admin/cms");
  return item;
}

export async function deleteContentItem(id: string) {
  await requireRole("ADMIN");
  const safeId = idSchema.parse(id);
  await prisma.contentItem.delete({ where: { id: safeId } });
  await writeAuditLog("CMS_CONTENT_DELETED", safeId, "Content item deleted");
  revalidatePath("/faq");
  revalidatePath("/safety");
  revalidatePath("/terms");
  revalidatePath("/admin/cms");
}
