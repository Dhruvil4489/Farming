import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { AuthShell } from '@/components/auth/AuthShell';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Create Account — SmartFarm AI',
  description: 'Create your SmartFarm AI farmer account using your email address.',
};

export default async function RegisterPage() {
  const user = await getAuthenticatedUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-8 text-xs text-stone-500">
          Loading registration form...
        </div>
      }
    >
      <AuthShell initialTab="signup" />
    </Suspense>
  );
}
