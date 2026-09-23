import { getAdminUserSupportSnapshot } from "../../actions/admin";
import { PageTransition } from "../../../components/layout/PageTransition";

export default async function ViewAsPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; reason?: string; ticketRef?: string }>;
}) {
  const { userId, reason, ticketRef } = await searchParams;
  let snapshot: Awaited<ReturnType<typeof getAdminUserSupportSnapshot>> | null = null;
  let error = "";

  if (userId) {
    try {
      snapshot = await getAdminUserSupportSnapshot(userId, {
        reason: reason || "",
        ticketRef: ticketRef || "",
      });
    } catch (err) {
      error = err instanceof Error ? err.message : "Unable to load user snapshot";
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-black">Read-only support view</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This does not sign in as the user, change their session, or permit actions as them. A support reason is required.
            Every successful lookup is audit logged with reason and ticket reference.
          </p>
        </div>

        <form className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-2">
          <input
            name="userId"
            defaultValue={userId || ""}
            placeholder="Paste the user ID"
            required
            className="min-w-0 rounded-xl border bg-background px-4 py-3 text-sm md:col-span-2"
          />
          <input
            name="reason"
            defaultValue={reason || ""}
            placeholder="Support reason (required)"
            required
            minLength={8}
            maxLength={300}
            className="min-w-0 rounded-xl border bg-background px-4 py-3 text-sm"
          />
          <input
            name="ticketRef"
            defaultValue={ticketRef || ""}
            placeholder="Ticket / reference ID (optional)"
            maxLength={80}
            className="min-w-0 rounded-xl border bg-background px-4 py-3 text-sm"
          />
          <button className="rounded-xl bg-[#008A4B] px-5 py-3 text-sm font-bold text-white md:col-span-2">
            Load support view
          </button>
        </form>

        {error && <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}

        {snapshot && (
          <div className="space-y-4">
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="text-lg font-bold">{snapshot.name || "Unnamed user"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {snapshot.email || "No email"} · {snapshot.role} · Joined {new Date(snapshot.createdAt).toLocaleString()}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-secondary p-3 text-sm">
                  Sent messages: <b>{snapshot._count.sentMessages}</b>
                </div>
                <div className="rounded-xl bg-secondary p-3 text-sm">
                  Received messages: <b>{snapshot._count.receivedMessages}</b>
                </div>
                <div className="rounded-xl bg-secondary p-3 text-sm">
                  Notifications: <b>{snapshot._count.notifications}</b>
                </div>
              </div>
            </section>
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border bg-card p-5">
                <h2 className="font-bold">Recent listings</h2>
                {snapshot.properties.length ? (
                  snapshot.properties.map((item) => (
                    <p key={item.id} className="border-b py-3 text-sm last:border-0">
                      {item.title} <span className="text-xs text-muted-foreground">· {item.status}</span>
                    </p>
                  ))
                ) : (
                  <p className="py-3 text-sm text-muted-foreground">No listings.</p>
                )}
              </div>
              <div className="rounded-2xl border bg-card p-5">
                <h2 className="font-bold">Recent bookings</h2>
                {snapshot.bookings.length ? (
                  snapshot.bookings.map((item) => (
                    <p key={item.id} className="border-b py-3 text-sm last:border-0">
                      {item.property.title} <span className="text-xs text-muted-foreground">· {item.status}</span>
                    </p>
                  ))
                ) : (
                  <p className="py-3 text-sm text-muted-foreground">No bookings.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
