import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded inline-block mb-4">
          MNF
        </div>
        <h1 className="text-4xl font-bold mb-2">MNF Manager</h1>
        <p className="text-green-300 mb-8">Monday Night Football analytics platform</p>
        <Link
          href="/players"
          className="bg-white text-green-900 font-semibold px-6 py-3 rounded-lg hover:bg-green-50 transition-colors"
        >
          View squad
        </Link>
      </div>
    </div>
  );
}