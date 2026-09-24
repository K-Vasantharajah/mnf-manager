import Link from 'next/link';
import Footer from '@/components/ui/Footer';
import Section from '@/components/ui/Section';

export const metadata = {
  title: 'Our story · MNF Manager',
};

export default function StoryPage() {
  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10 md:py-16">
        <Link href="/access" className="text-sm text-muted hover:text-paper transition-colors">
          &larr; Back to sign in
        </Link>

        <h1 className="font-display text-3xl text-paper mt-6">Our story</h1>

        <div className="mt-10 space-y-10">
          <Section title="Monday Night Football">
            <p>
              MNF is a weekly 9-a-side game that started in 2025. Every Monday, hence the name —
              give or take a bank holiday, when we take whatever slot we can get.
            </p>
            <p>
              Two captains pick teams from whoever turns up. The challenging captain picks first and
              the winning captain picks second, alternating from there — so the captain who won the
              previous week is always a step behind, countering rather than choosing.
            </p>
            <p>It makes an unbeaten run as the winning captain worth something.</p>
          </Section>

          <Section title="Where the data comes from">
            <p>
              Every result on this site traces back to a spreadsheet Arif has kept since the
              beginning: scores, line-ups, goals, week after week. None of this exists without that
              record.
            </p>
            <p>
              I joined in July 2025, and like anyone new, I had no idea who half the squad were.
              Hard to pick a balanced team when you don&apos;t know who you&apos;re picking.
            </p>
            <p>
              MNF Manager is what happens when you take a well-kept spreadsheet and give it
              somewhere to live.
            </p>
          </Section>

          <Section title="About the ratings">
            <p>
              The ratings are calculated from the matches we record — who played, who they played
              with, and how those games ended.
            </p>
            <p>They measure impact on results, not ability.</p>
            <p>
              They also can&apos;t see that it&apos;s Monday: a full day&apos;s work behind you, a
              family at home, and somehow you&apos;re expected to find a through ball.
            </p>
            <p>
              Everything is relative to this group and nothing else. Whoever sits at the top is top
              at MNF, and whoever sits at the bottom is bottom at MNF. Put any of us on a pitch with
              a professional and we&apos;d all be a 1.
            </p>
            <p>
              So take the ratings as a talking point rather than a verdict. A bit of needle is what
              makes a Monday night worth turning up for — without it, it&apos;s just a kickabout.
            </p>
          </Section>

          <Section title="What this is">
            <p>MNF Manager is a hobby project, built and run by Kobi.</p>
            <p>
              It isn&apos;t a product, there&apos;s nothing to buy, and player data isn&apos;t sold
              or used for advertising. It exists because a group of mates play football on a Monday
              and someone kept score.
            </p>
            <p>
              Match data stays behind the group&apos;s access code. You can read more on the{' '}
              <Link href="/privacy" className="text-pitch hover:opacity-80">
                privacy page
              </Link>
              .
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
