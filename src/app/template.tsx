import { PageTransition } from "../components/layout/PageTransition";

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition><div className="min-h-full">{children}</div></PageTransition>;
}
