import { AuthProvider } from "@/lib/auth-context";

export default function VideoStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0b0f19] text-slate-200">{children}</div>
    </AuthProvider>
  );
}
