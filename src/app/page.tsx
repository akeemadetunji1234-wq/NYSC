import App from "./App";
import { getPublicMarketplaceStats } from "./actions/public";
import { getPublishedProperties } from "./actions/property";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [stats, properties] = await Promise.all([
    getPublicMarketplaceStats(),
    getPublishedProperties().catch(() => []),
  ]);

  const liveListings = (Array.isArray(properties) ? properties : []).slice(0, 4).map((p: {
    id: string;
    title: string;
    location: string;
    state: string | null;
    lga: string | null;
    price: number;
    bedrooms: number;
    images: string[];
    amenities?: string[];
    agent?: { name?: string | null; agentVerified?: boolean | null } | null;
  }) => ({
    id: p.id,
    title: p.title,
    location: p.location,
    state: p.state,
    lga: p.lga,
    price: p.price,
    bedrooms: p.bedrooms,
    images: p.images || [],
    amenities: p.amenities || [],
    agent: p.agent
      ? { name: p.agent.name, agentVerified: p.agent.agentVerified }
      : null,
  }));

  return <App stats={stats} liveListings={liveListings} />;
}
