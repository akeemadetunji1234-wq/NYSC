import { AuthProvider } from "../../components/auth/AuthProvider";
import AdminClientLayout from "./AdminClientLayout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminClientLayout>{children}</AdminClientLayout>
    </AuthProvider>
  );
}
