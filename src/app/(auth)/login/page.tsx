import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { AuthShell } from '@/components/auth/AuthShell';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sign In — SmartFarm AI',
  description: 'Sign in with your email address to access your farms, crops, weather, and AI advisories.',
};

export default async function LoginPage() {
  const user = await getAuthenticatedUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-8 text-xs text-stone-500">
          Loading SmartFarm AI authentication...
        </div>
      }
    >
      <AuthShell initialTab="signin" />
    </Suspense>
  );
}
