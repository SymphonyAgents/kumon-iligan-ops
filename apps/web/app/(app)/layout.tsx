import { Sidebar } from '@/components/layout/sidebar';
import { OnboardingCheck } from '@/components/auth/OnboardingCheck';

// Spec: sidebar 232px fixed, main area padded 24px top, 32px sides, 36px bottom.
// No max-width centering — content fills the workspace.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
 return (
 <div className="min-h-screen bg-background text-foreground">
 <OnboardingCheck />
 <Sidebar />
 <div className="pt-14 lg:pt-0 lg:ml-[232px]">
 <main className="px-5 pt-5 pb-9 sm:px-8 sm:pt-6 sm:pb-9 lg:px-8 lg:pt-6 lg:pb-9">
 {children}
 </main>
 </div>
 </div>
 );
}
