import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="ml-56">
        <main className="max-w-7xl mx-auto px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
