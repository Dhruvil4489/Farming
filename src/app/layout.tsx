import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SmartFarm AI — Your Intelligent Digital Farming Companion',
  description: 'Farmer-first digital agriculture platform supporting full crop lifecycle management.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF6EF] text-stone-900 antialiased selection:bg-[#2F7D4F] selection:text-white">
        {children}
      </body>
    </html>
  );
}
