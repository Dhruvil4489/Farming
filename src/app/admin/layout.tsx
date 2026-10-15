import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  const isAdmin = user.roles.some((r) => r.role.name === 'ADMIN');
  if (!isAdmin) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
