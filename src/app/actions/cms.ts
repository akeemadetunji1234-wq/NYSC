"use server";

import { prisma } from "../../lib/prisma";
import { requireRole } from "../../lib/authGuard";
import { revalidatePath } from "next/cache";

export async function getContentItems(category?: string) {
  return prisma.contentItem.findMany({
    where: category ? { category } : undefined,
    orderBy: { updatedAt: "desc" },
  });
}

export async function upsertContentItem(input: { slug: string; title: string; category: string; content: string; published?: boolean }) {
  await requireRole("ADMIN");
  const item = await prisma.contentItem.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      category: input.category,
      content: input.content,
      published: input.published ?? true,
    },
    create: {
      slug: input.slug,
      title: input.title,
      category: input.category,
      content: input.content,
      published: input.published ?? true,
    },
  });
  revalidatePath("/faq");
  revalidatePath("/safety");
  revalidatePath("/admin/cms");
  return item;
}

export async function deleteContentItem(id: string) {
  await requireRole("ADMIN");
  await prisma.contentItem.delete({ where: { id } });
  revalidatePath("/admin/cms");
}
