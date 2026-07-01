import { MemberNavbar } from "../../components/layout/MemberNavbar";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-secondary font-sans flex flex-col">
      <MemberNavbar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
