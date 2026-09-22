'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CloseIcon } from '@/components/ui/icons';
import { useHasAccess } from '@/lib/useHasAccess';

const AuthNav = dynamic(() => import('./AuthNav'), { ssr: false });

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M2 5H16M2 9H16M2 13H16"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const access = useHasAccess();

  useEffect(() => {
    if (access === false) {
      router.replace('/access');
    }
  }, [access, router]);

  // Render nothing until we know the visitor has access, so real data never flashes on screen
  if (!access) {
    return <div className="min-h-screen bg-ink" />;
  }

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
          <div className="flex items-center justify-between h-[72px]">
            <div className="flex items-center gap-2.5 shrink-0">
              <Image src="/icon.png" alt="" width={22} height={22} className="opacity-90" />
              <span className="font-display text-lg text-paper">MNF</span>
              <span className="text-xs text-muted hidden sm:inline">Manager</span>
            </div>

            {/* Desktop links — hidden below md, where they move into the menu below */}
            <div className="hidden md:flex gap-8 flex-1 ml-10">
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

            <div className="flex items-center gap-3 shrink-0">
              <AuthNav />
              <button
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                className="md:hidden text-muted hover:text-paper p-1.5 -mr-1.5 transition-colors"
              >
                {menuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="md:hidden border-t border-line bg-surface">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    pathname.startsWith(item.href)
                      ? 'bg-surface-2 text-paper'
                      : 'text-muted hover:text-paper'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-10">{children}</main>
    </div>
  );
}
