import { getArtisans } from "../../actions/admin";
import { ArtisanManagementTable } from "../../../features/admin/ArtisanManagementTable";

export default async function AdminArtisansPage() {
  const artisans = await getArtisans();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground">Artisan Directory</h1>
          <p className="text-muted-foreground mt-1">
            Manage all platform artisans, verify their credentials, and monitor their ratings.
          </p>
        </div>
      </div>

      <div className="h-[calc(100vh-180px)] min-h-[500px]">
        <ArtisanManagementTable initialArtisans={artisans} />
      </div>
    </div>
  );
}
