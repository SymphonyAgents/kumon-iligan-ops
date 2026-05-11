import { RequireSuperadmin } from '@/components/auth/RequireSuperadmin';

export default function BranchesLayout({ children }: { children: React.ReactNode }) {
  return <RequireSuperadmin>{children}</RequireSuperadmin>;
}
