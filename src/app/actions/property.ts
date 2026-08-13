"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, requireOwnerOrAdmin, requireUser } from "../../lib/authGuard";

// Type definition for creating a new property
export type CreatePropertyInput = {
  title: string;
  description: string;
  location: string;
  state: string;
  lga?: string;
  latitude?: number;
  longitude?: number;
  price: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  videoUrl?: string;
  agentId: string;
};


// Fetch all published properties for the Corp Member view
export async function getPublishedProperties(userId?: string) {
  if (userId) {
    const sessionUser = await requireUser();
    if (sessionUser.id !== userId) throw new Error("Forbidden");
  }
  try {
    const properties = await prisma.property.findMany({
      where: {
        status: "PUBLISHED",
      },
      include: {
        agent: {
          select: {
            name: true,
            image: true,
            agentVerified: true,
          },
        },
        ...(userId && {
          savedBy: {
            where: { userId },
            select: { id: true },
          }
        }),
      },
      orderBy: [
        { isBoosted: "desc" },
        { createdAt: "desc" }
      ],
    });

    return properties.map(p => ({
      ...p,
      isSaved: userId ? (p as any).savedBy?.length > 0 : false,
    }));
  } catch (error: any) {
    console.error("Error fetching published properties details:", error);
    throw new Error(`Failed to fetch properties: ${error?.message || error}`);
  }
}

// Fetch a single property by ID
export async function getPropertyById(id: string) {
  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            name: true,
            image: true,
            agentVerified: true,
            phone: true,
            email: true,
            whatsapp: true,
          },
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
  try {
    const properties = await prisma.property.findMany({
      where: { id: { in: ids }, status: "PUBLISHED" },
      include: {
        agent: {
          select: {
            name: true,
            image: true,
            agentVerified: true,
          },
        },
      },
    });
    return properties;
  } catch (error) {
    console.error("Error fetching properties by IDs:", error);
    return [];
  }
}

// Fetch properties owned by a specific Agent
export async function getAgentProperties(agentId: string) {
  await requireOwnerOrAdmin(agentId);
  if (!agentId) return [];
  try {
    const properties = await prisma.property.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
    });
    return properties;
  } catch (error) {
    console.error("Error fetching agent properties:", error);
    throw new Error("Failed to fetch agent properties");
  }
}

// Create a new property listing
export async function createProperty(data: CreatePropertyInput) {
  const user = await requireRole(["AGENT", "ADMIN"]);
  
  // Prevent spoofing: use only the authenticated user's ID and force moderation.
  const { agentId: _ignoredAgentId, ...untrustedFields } = data as CreatePropertyInput & { status?: unknown };
  const safeData = { ...untrustedFields, agentId: user.id, status: "PENDING" as const };

  try {
    // Check if the agent is verified
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      throw new Error("Agent not found");
    }
    if (user.role === "AGENT" && !user.agentVerified) {
      return { success: false, error: "UNVERIFIED_AGENT" };
    }

    // Check premium limits
    if (user.role === "AGENT" && user.premiumPlan !== "AGENT_PREMIUM") {
      const propertyCount = await prisma.property.count({ where: { agentId: data.agentId } });
      if (propertyCount >= 5) {
        return { success: false, error: "PREMIUM_REQUIRED" };
      }
    }

    const property = await prisma.property.create({
      data: {
        ...safeData, // Wait for explicit publish action
      },
    });
    
    // Revalidate paths so the new property shows up (if it was auto-published, but it's pending so maybe just dashboard)
    revalidatePath("/agent/properties");
    
    return { success: true, property };
  } catch (error: any) {
    console.error("Error creating property:", error);
    return { success: false, error: "Failed to create property" };
  }
}

// Update an existing property
export async function updateProperty(id: string, data: Partial<CreatePropertyInput>) {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw new Error("Property not found");
  const user = await requireOwnerOrAdmin(property.agentId);
  const safeData = { ...(data as Record<string, unknown>) };
  delete safeData.agentId;
  if (user.role !== "ADMIN") safeData.status = "PENDING";

  try {
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: safeData,
    });
    
    revalidatePath("/agent/properties");
    revalidatePath("/member");
    
    return property;
  } catch (error) {
    console.error("Error updating property:", error);
    throw new Error("Failed to update property");
  }
}

// Delete a property
export async function deleteProperty(id: string) {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw new Error("Property not found");
  await requireOwnerOrAdmin(property.agentId);

  try {
    const deletedProperty = await prisma.property.delete({
      where: { id },
    });
    
    revalidatePath("/agent/properties");
    revalidatePath("/member");
    
    return property;
  } catch (error) {
    console.error("Error deleting property:", error);
    throw new Error("Failed to delete property");
  }
}

// Boost a property
export async function boostProperty(id: string) {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return { success: false, error: "Property not found" };
  await requireOwnerOrAdmin(property.agentId);

  try {
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: { isBoosted: true },
    });
    revalidatePath("/agent/properties/boost");
    revalidatePath("/member"); // Revalidate search pages
    revalidatePath("/member/search");
    return { success: true, property };
  } catch (error: any) {
    console.error("Error boosting property:", error);
    return { success: false, error: "Failed to boost property" };
  }
}
