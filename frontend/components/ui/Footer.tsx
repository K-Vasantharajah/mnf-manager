import Link from 'next/link';
import { FEEDBACK_URL, GITHUB_URL } from '@/lib/site';

const linkClass = 'hover:text-paper transition-colors';

export default function Footer() {
  return (
    <footer className="border-t border-line mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
        <span>MNF Manager &middot; a hobby project for Monday Night Football</span>
        <div className="flex items-center gap-5">
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
          <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Feedback
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
