import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-green-100 hover:text-white hover:bg-green-800 rounded transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/players"
                className="px-4 py-2 text-sm font-medium text-green-100 hover:text-white hover:bg-green-800 rounded transition-colors"
              >
                Players
              </Link>
              <Link
                href="/matches"
                className="px-4 py-2 text-sm font-medium text-green-100 hover:text-white hover:bg-green-800 rounded transition-colors"
              >
                Matches
              </Link>
              <Link
                href="/leaderboard"
                className="px-4 py-2 text-sm font-medium text-green-100 hover:text-white hover:bg-green-800 rounded transition-colors"
              >
                Leaderboard
              </Link>
              <Link
                href="/captains"
                className="px-4 py-2 text-sm font-medium text-green-100 hover:text-white hover:bg-green-800 rounded transition-colors"
              >
                Captains
              </Link>
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