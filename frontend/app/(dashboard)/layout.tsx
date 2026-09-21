'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const AuthNav = dynamic(() => import('./AuthNav'), { ssr: false });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/players', label: 'Players' },
    { href: '/matches', label: 'Matches' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/captains', label: 'Captains' },
    { href: '/draft', label: 'Draft' },
  ];

  return (
    <div className="min-h-screen bg-ink">
      <nav className="border-b border-line">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-10 h-18">
            <div className="flex items-center gap-2.5">
              <Image src="/icon.png" alt="" width={22} height={22} className="opacity-90" />
              <span className="font-display text-lg text-paper">MNF</span>
              <span className="text-xs text-muted">Manager</span>
            </div>
            <div className="flex gap-8 flex-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm pb-[26px] pt-[26px] border-b-2 transition-colors ${
                    pathname.startsWith(item.href)
                      ? 'border-pitch text-paper'
                      : 'border-transparent text-muted hover:text-paper'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <AuthNav />
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-10">{children}</main>
    </div>
  );
}
