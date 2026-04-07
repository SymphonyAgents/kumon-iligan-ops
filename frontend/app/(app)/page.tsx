import { PageHeader } from '@/components/ui/page-header';
export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Kumon Iligan tuition overview" />
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['Total Students', 'Pending Payments', 'Verified This Month', 'Overdue Periods'].map((label) => (
          <div key={label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mt-1">&mdash;</p>
          </div>
        ))}
      </div>
    </div>
  );
}
