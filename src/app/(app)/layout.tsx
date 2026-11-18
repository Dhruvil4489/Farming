import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { Navbar } from '@/components/domain/Navbar';
import { Sidebar } from '@/components/domain/Sidebar';
import { BottomNav } from '@/components/domain/BottomNav';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  const isAdmin = user.roles.some((r) => r.role.name === 'ADMIN');

  return (
        <div className="min-h-screen flex flex-col bg-[#F7F8F5]">
          <Navbar
            userName={user.name || 'Farmer'}
            isDemo={user.isDemo || false}
            isAdmin={isAdmin}
          />
          <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 lg:pb-0">
            <Sidebar isAdmin={isAdmin} />
            <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
          </div>
          <BottomNav />
        </div>
        );
}
