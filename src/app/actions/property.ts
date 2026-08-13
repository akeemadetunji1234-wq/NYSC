"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, requireOwnerOrAdmin, requireUser } from "../../lib/authGuard";

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

// Fetch all published properties for the Corp Member view
export async function getPublishedProperties(userId?: string) {
  if (userId) {
    const sessionUser = await requireUser();
    if (sessionUser.id !== userId) throw new Error("Forbidden");
  }
  try {
    const properties = await prisma.property.findMany({
      where: { status: "PUBLISHED" },
      include: {
        agent: { select: { name: true, image: true, agentVerified: true } },
        ...(userId && { savedBy: { where: { userId }, select: { id: true } } }),
      },
      orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
    });

    return properties.map((p) => ({
      ...p,
      isSaved: userId ? (p as any).savedBy?.length > 0 : false,
    }));
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
          select: { name: true, image: true, agentVerified: true, phone: true, email: true, whatsapp: true },
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

// Fetch multiple properties by their IDs for comparison
export async function getPropertiesByIds(ids: string[]) {
  if (!Array.isArray(ids) || ids.length > 50 || ids.some((id) => !validId(id))) return [];
  try {
    return await prisma.property.findMany({
      where: { id: { in: ids }, status: "PUBLISHED" },
      include: { agent: { select: { name: true, image: true, agentVerified: true } } },
    });
  } catch (error) {
    console.error("Error fetching properties by IDs:", error);
    return [];
  }
}

// Fetch properties owned by a specific Agent
export async function getAgentProperties(agentId: string) {
  if (!validId(agentId)) return [];
  await requireOwnerOrAdmin(agentId);
  try {
    return await prisma.property.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
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
    revalidatePath("/agent/properties");
    revalidatePath("/member");
    return deletedProperty;
  } catch (error) {
    console.error("Error deleting property:", error);
    throw new Error("Failed to delete property");
  }
}

// Boost a property
export async function boostProperty(id: string) {
  if (!validId(id)) return { success: false, error: "Invalid property identifier" };
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return { success: false, error: "Property not found" };
  await requireOwnerOrAdmin(property.agentId);

  try {
    const updatedProperty = await prisma.property.update({ where: { id }, data: { isBoosted: true } });
    revalidatePath("/agent/properties/boost");
    revalidatePath("/member");
    revalidatePath("/member/search");
    return { success: true, property: updatedProperty };
  } catch (error) {
    console.error("Error boosting property:", error);
    return { success: false, error: "Failed to boost property" };
  }
}
