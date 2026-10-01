'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sprout, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    state: 'Gujarat',
    district: 'Vadodara',
    village: '',
    preferredLanguage: 'en',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#2F7D4F] text-white rounded-xl mx-auto flex items-center justify-center shadow-md">
            <Sprout size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#143D2A]">Register as a Farmer</h1>
          <p className="text-xs text-stone-500">Quick sign-up with simple information</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Ramesh Patel"
            whyAsk="We use your name to personalize your farming advisory and alerts."
            required
          />

          <Input
            label="Mobile Number *"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. +91 98765 43210"
            whyAsk="Mobile number is used to log in securely and receive critical weather alerts."
            required
          />

          <Input
            label="Email Address (Optional)"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="e.g. ramesh@gmail.com"
          />

          <Input
            label="Password *"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 6 characters"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="State"
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
            <Input
              label="District"
              type="text"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </div>

          <Input
            label="Village / Town (Optional)"
            type="text"
            value={form.village}
            onChange={(e) => setForm({ ...form, village: e.target.value })}
            placeholder="e.g. Padra"
          />

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-stone-800">Preferred Language</label>
            <select
              value={form.preferredLanguage}
              onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2F7D4F]"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
            </select>
          </div>

          <Button type="submit" isLoading={loading} className="w-full">
            <UserPlus size={16} className="mr-2" /> Complete Registration
          </Button>
        </form>

        <p className="text-center text-xs text-stone-600 pt-2">
          Already registered?{' '}
          <Link href="/login" className="font-bold text-[#2F7D4F] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
