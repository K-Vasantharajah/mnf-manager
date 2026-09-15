'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { GoogleLogin } from '@react-oauth/google';
import api from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isAdmin, login, logout } = useAuth();
  const router = useRouter();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/players', label: 'Players' },
    { href: '/matches', label: 'Matches' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/captains', label: 'Captains' },
    { href: '/draft', label: 'Draft' },
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
            <div className="flex gap-1 flex-1">
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
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="text-right">
                    <div className="text-xs text-green-200">{user.name}</div>
                    {isAdmin && (
                      <div className="text-xs text-green-400">Admin</div>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="text-xs text-green-300 hover:text-white border border-green-700 px-3 py-1 rounded-lg"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                    <GoogleLogin
                      onSuccess={async (credentialResponse) => {
                        try {
                          const { data } = await api.post('/api/v1/auth/google', {
                            idToken: credentialResponse.credential,
                          });
                          login({
                            email: data.email,
                            name: data.name,
                            picture: data.picture,
                            role: data.role,
                            token: data.token,
                          });
                        } catch {
                          alert('Login failed. Please try again.');
                        }
                      }}
                      onError={() => alert('Google login failed')}
                      useOneTap
                      shape="pill"
                      theme="outline"
                      size="medium"
                      text="signin_with"
                    />
                  )}
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