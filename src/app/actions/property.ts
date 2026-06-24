"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

// Type definition for creating a new property
export type CreatePropertyInput = {
  title: string;
  description: string;
  location: string;
  state: string;
  lga?: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  agentId: string;
};

// Fetch all published properties for the Corp Member view
export async function getPublishedProperties(userId?: string) {
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return properties.map(p => ({
      ...p,
      isSaved: userId ? (p as any).savedBy?.length > 0 : false,
    }));
  } catch (error) {
    console.error("Error fetching published properties:", error);
    throw new Error("Failed to fetch properties");
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
          },
        },
      },
    });
    return property;
  } catch (error) {
    console.error("Error fetching property:", error);
    throw new Error("Failed to fetch property");
  }
}

// Fetch properties owned by a specific Agent
export async function getAgentProperties(agentId: string) {
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
  try {
    // Ensure mock agent exists for testing
    if (data.agentId === "mock-agent-id") {
      const existingAgent = await prisma.user.findUnique({ where: { id: "mock-agent-id" } });
      if (!existingAgent) {
        await prisma.user.create({
          data: {
            id: "mock-agent-id",
            name: "Mock Agent",
            email: "agent@mock.com",
            role: "AGENT",
          }
        });
      }
    }

    // Check if the agent is verified
    const user = await prisma.user.findUnique({ where: { id: data.agentId } });
    if (!user) {
      throw new Error("Agent not found");
    }
    if (user.role === "AGENT" && !user.agentVerified) {
      throw new Error("UNVERIFIED_AGENT");
    }

    const property = await prisma.property.create({
      data: {
        ...data,
        status: "PUBLISHED", // Auto-publish for testing purposes
      },
    });
    
    // Revalidate paths so the new property shows up (if it was auto-published, but it's pending so maybe just dashboard)
    revalidatePath("/agent/properties");
    
    return property;
  } catch (error: any) {
    console.error("Error creating property:", error);
    if (error.message === "UNVERIFIED_AGENT") {
      throw error;
    }
    throw new Error("Failed to create property");
  }
}

// Update an existing property
export async function updateProperty(id: string, data: Partial<CreatePropertyInput>) {
  try {
    const property = await prisma.property.update({
      where: { id },
      data,
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
  try {
    const property = await prisma.property.delete({
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
