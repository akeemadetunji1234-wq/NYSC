"use server";

import { getServerSession } from "next-auth";
import { prisma } from "../../lib/prisma";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, requireOwnerOrAdmin, requireUser } from "../../lib/authGuard";
import { writeAuditLog } from "../../lib/audit";

const propertyFieldsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(20_000),
  location: z.string().trim().min(1).max(200),
  state: z.string().trim().min(1).max(120),
  lga: z.string().trim().max(120).nullable().optional(),
  latitude: z.number().finite().min(-90).max(90).nullable().optional(),
  longitude: z.number().finite().min(-180).max(180).nullable().optional(),
  price: z.number().finite().min(0).max(100_000_000),
  bedrooms: z.number().int().min(1).max(100),
  bathrooms: z.number().int().min(1).max(100),
  amenities: z.array(z.string().trim().min(1).max(100)).max(50),
  images: z.array(z.string().trim().min(1).max(2_048)).max(50),
  videoUrl: z.string().trim().max(2_048).nullable().optional(),
});

const propertyUpdateSchema = propertyFieldsSchema.partial().extend({
  status: z.enum(["DRAFT", "PENDING", "PUBLISHED", "REJECTED"]).optional(),
});

export type CreatePropertyInput = z.infer<typeof propertyFieldsSchema> & {
  agentId?: string;
};

function validId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 100;
}

export async function recordPropertyView(id: string, viewerId?: string | null) {
  if (!validId(id)) return;
  const property = await prisma.property.findUnique({
    where: { id },
    select: { agentId: true, status: true },
  });
  if (!property || property.status !== "PUBLISHED" || (viewerId && property.agentId === viewerId)) return;
  await prisma.property.updateMany({
    where: { id, status: "PUBLISHED" },
    data: { views: { increment: 1 } },
  });
}

// Fetch all published properties for the Corp Member view
export async function getPublishedProperties() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  try {
    const properties = await prisma.property.findMany({
      where: { status: "PUBLISHED" },
      include: {
        agent: { select: { name: true, image: true, agentVerified: true, agentVerifiedAt: true } },
        ...(userId && { savedBy: { where: { userId }, select: { id: true } } }),
      },
      orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
    });

    const now = new Date();
    return properties
      .map((p) => ({
        ...p,
        isBoosted: p.isBoosted && !!p.boostedUntil && p.boostedUntil > now,
        isSaved: userId ? (p as any).savedBy?.length > 0 : false,
      }))
      .sort((a, b) => Number(b.isBoosted) - Number(a.isBoosted));
  } catch (error) {
    console.error("Error fetching published properties details:", error);
    throw new Error("Failed to fetch properties");
  }
}

// Fetch a single property by ID
export async function getPropertyById(id: string) {
  if (!validId(id)) throw new Error("Invalid property identifier");
  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        agent: {
          select: { name: true, image: true, agentVerified: true, agentVerifiedAt: true },
        },
      },
    });
    if (property && property.status !== "PUBLISHED") {
      await requireOwnerOrAdmin(property.agentId);
    }
    return property;
  } catch (error) {
    console.error("Error fetching property:", error);
    throw new Error("Failed to fetch property");
  }
}

export async function getListingContact(propertyId: string) {
  if (!validId(propertyId)) throw new Error("Invalid property identifier");
  await requireRole("CORP");
  const property = await prisma.property.findUnique({
    where: { id: propertyId, status: "PUBLISHED" },
    select: {
      agent: { select: { phone: true, whatsapp: true } },
    },
  });
  return property?.agent ?? null;
}

// Fetch multiple properties by their IDs for comparison
export async function getPropertiesByIds(ids: string[]) {
  if (!Array.isArray(ids) || ids.length > 50 || ids.some((id) => !validId(id))) return [];
  try {
    return await prisma.property.findMany({
      where: { id: { in: ids }, status: "PUBLISHED" },
      include: { agent: { select: { name: true, image: true, agentVerified: true, agentVerifiedAt: true } } },
    });
  } catch (error) {
    console.error("Error fetching properties by IDs:", error);
    return [];
  }
}

// Fetch properties owned by a specific Agent
export async function getAgentProperties() {
  const user = await requireRole("AGENT");
  const agentId = user.id;
  try {
    return await prisma.property.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, location: true, state: true, lga: true, price: true,
        bedrooms: true, bathrooms: true, images: true, status: true, isBoosted: true, boostedUntil: true,
      },
    });
  } catch (error) {
    console.error("Error fetching agent properties:", error);
    throw new Error("Failed to fetch agent properties");
  }
}

// Create a new property listing
export async function createProperty(data: unknown) {
  const user = await requireRole(["AGENT", "ADMIN"]);
  const parsed = propertyFieldsSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid property details" };

  const safeData = { ...parsed.data, agentId: user.id, status: "PENDING" as const };

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, agentVerified: true, isBanned: true, premiumPlan: true },
    });
    if (!dbUser || dbUser.isBanned) throw new Error("Agent not found");
    if (user.role === "AGENT" && !dbUser.agentVerified) {
      return { success: false, error: "UNVERIFIED_AGENT" };
    }

    if (user.role === "AGENT" && dbUser.premiumPlan !== "AGENT_PREMIUM") {
      const propertyCount = await prisma.property.count({ where: { agentId: user.id } });
      if (propertyCount >= 5) return { success: false, error: "PREMIUM_REQUIRED" };
    }

    const property = await prisma.property.create({ data: safeData });
    await writeAuditLog("PROPERTY_CREATED", property.id, `Listing created: ${property.title}`);
    revalidatePath("/agent/properties");
    return { success: true, property };
  } catch (error) {
    console.error("Error creating property:", error);
    return { success: false, error: "Failed to create property" };
  }
}

// Update an existing property
export async function updateProperty(id: string, data: unknown) {
  if (!validId(id)) throw new Error("Invalid property identifier");
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw new Error("Property not found");

  const user = await requireOwnerOrAdmin(property.agentId);
  const parsed = propertyUpdateSchema.safeParse(data);
  if (!parsed.success || Object.keys(parsed.data).length === 0) throw new Error("Invalid property details");

  const { status, ...fields } = parsed.data;
  const safeData = user.role === "ADMIN"
    ? { ...fields, ...(status ? { status } : {}) }
    : { ...fields, status: "PENDING" as const };

  try {
    const updatedProperty = await prisma.property.update({ where: { id }, data: safeData });
    await writeAuditLog("PROPERTY_UPDATED", id, user.role === "ADMIN" && status ? `Listing status changed to ${status}` : "Listing details updated");
    revalidatePath("/agent/properties");
    revalidatePath("/member");
    return updatedProperty;
  } catch (error) {
    console.error("Error updating property:", error);
    throw new Error("Failed to update property");
  }
}

// Delete a property
export async function deleteProperty(id: string) {
  if (!validId(id)) throw new Error("Invalid property identifier");
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw new Error("Property not found");
  await requireOwnerOrAdmin(property.agentId);

  try {
    const deletedProperty = await prisma.property.delete({ where: { id } });
    await writeAuditLog("PROPERTY_DELETED", id, `Listing deleted: ${deletedProperty.title}`);
    revalidatePath("/agent/properties");
    revalidatePath("/member");
    return deletedProperty;
  } catch (error) {
    console.error("Error deleting property:", error);
    throw new Error("Failed to delete property");
  }
}

// Boost a property for an active Agent Premium subscription.
export async function boostProperty(id: string) {
  if (!validId(id)) return { success: false, error: "Invalid property identifier" };
  const user = await requireRole("AGENT");
  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, agentId: true, status: true, isBoosted: true, boostedUntil: true },
  });
  if (!property || property.agentId !== user.id) return { success: false, error: "Property not found" };
  if (property.status !== "PUBLISHED") return { success: false, error: "Only published listings can be boosted" };

  const entitlement = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isPremium: true, premiumPlan: true, premiumExpiry: true },
  });
  const premiumActive = entitlement?.isPremium === true
    && entitlement.premiumPlan === "AGENT_PREMIUM"
    && (!entitlement.premiumExpiry || entitlement.premiumExpiry > new Date());
  if (!premiumActive) return { success: false, error: "Agent Premium is required to boost a listing" };

  try {
    const boostedUntil = new Date();
    boostedUntil.setDate(boostedUntil.getDate() + 30);
    const updatedProperty = await prisma.property.update({
      where: { id: property.id },
      data: { isBoosted: true, boostedUntil },
      select: { id: true, isBoosted: true, boostedUntil: true },
    });
    await writeAuditLog("PROPERTY_BOOSTED", property.id, `Featured boost active until ${boostedUntil.toISOString()}`);
    revalidatePath("/agent/properties/boost");
    revalidatePath("/member");
    revalidatePath("/member/search");
    return { success: true, property: updatedProperty };
  } catch (error) {
    console.error("Error boosting property:", error);
    return { success: false, error: "Failed to boost property" };
  }
}
