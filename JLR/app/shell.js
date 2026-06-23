'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import TopHeader from '../components/TopHeader';

export default function Shell({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <div className="min-h-screen bg-cream">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-cream relative">
      <TopHeader />
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
