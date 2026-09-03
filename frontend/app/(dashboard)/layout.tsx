'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/players', label: 'Players' },
    { href: '/matches', label: 'Matches' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/captains', label: 'Captains' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-8 h-14">
            <div className="flex items-center gap-3">
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                MNF
              </span>
              <span className="font-bold text-lg tracking-tight">Manager</span>
            </div>
            <div className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    pathname.startsWith(item.href)
                      ? 'bg-green-700 text-white'
                      : 'text-green-100 hover:text-white hover:bg-green-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}