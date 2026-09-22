import { ExploreClient } from "./ExploreClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse NYSC Housing | Neat & Affordable",
  description: "Search verified, PPA-aware apartments for NYSC corps members without creating an account.",
};

export default function ExplorePage() {
  return <ExploreClient />;
}
