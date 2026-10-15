import React, { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Register as Farmer — SmartFarm AI',
  description: 'Create your SmartFarm AI profile to manage crops, soil, and mandi market feeds.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4 sm:p-8">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#2F7D4F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-500 font-medium">Loading registration form...</p>
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
