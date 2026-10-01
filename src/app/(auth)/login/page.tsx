'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sprout, LogIn, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoFarmer = () => {
    setIdentifier('farmer@smartfarm.ai');
    setPassword('farmer123456');
  };

  const fillDemoAdmin = () => {
    setIdentifier('admin@smartfarm.ai');
    setPassword('admin123456');
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#2F7D4F] text-white rounded-xl mx-auto flex items-center justify-center shadow-md">
            <Sprout size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#143D2A]">Sign In to SmartFarm AI</h1>
          <p className="text-xs text-stone-500">Access your digital farming dashboard</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mobile Number or Email"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. +919876543211 or farmer@smartfarm.ai"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" isLoading={loading} className="w-full">
            <LogIn size={16} className="mr-2" /> Sign In
          </Button>
        </form>

        <div className="pt-4 border-t border-stone-200 space-y-2 text-center">
          <p className="text-xs text-stone-500 font-semibold mb-2">Quick Demo Sign In Options:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={fillDemoFarmer}
              type="button"
              className="px-3 py-2 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              Demo Farmer Account
            </button>
            <button
              onClick={fillDemoAdmin}
              type="button"
              className="px-3 py-2 bg-stone-100 border border-stone-300 text-stone-900 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors"
            >
              Demo Admin Account
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-stone-600 pt-2">
          Don't have an account?{' '}
          <Link href="/register" className="font-bold text-[#2F7D4F] hover:underline">
            Register as Farmer
          </Link>
        </p>
      </div>
    </div>
  );
}
