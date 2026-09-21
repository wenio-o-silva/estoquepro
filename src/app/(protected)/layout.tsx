import { MainLayout } from '@/components/MainLayout';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
