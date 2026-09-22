import App from "./App";
import { getPublicMarketplaceStats } from "./actions/public";

export const dynamic = "force-dynamic";

export default async function Page() {
  const stats = await getPublicMarketplaceStats();
  return <App stats={stats} />;
}
