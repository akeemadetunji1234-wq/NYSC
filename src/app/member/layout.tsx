import { MemberNavbar } from "../../components/layout/MemberNavbar";
import { ThemeProvider } from "../../components/ThemeProvider";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider storageKey="theme-member">
      <div className="min-h-screen bg-secondary font-sans flex flex-col">
        <MemberNavbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
