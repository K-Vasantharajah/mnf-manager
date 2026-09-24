import Link from 'next/link';
import Footer from '@/components/ui/Footer';
import Section from '@/components/ui/Section';
import { CONTACT_EMAIL } from '@/lib/site';

export const metadata = {
  title: 'Privacy · MNF Manager',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10 md:py-16">
        <Link href="/access" className="text-sm text-muted hover:text-paper transition-colors">
          &larr; Back to sign in
        </Link>

        <h1 className="font-display text-3xl text-paper mt-6">Privacy</h1>
        <p className="text-xs text-muted mt-2">Last updated 23 September 2026</p>

        <div className="mt-10 space-y-8">
          <Section title="Who runs MNF Manager">
            <p>
              MNF Manager is a non-commercial hobby project built and run by Kobi for the Monday
              Night Football group. A small number of group members have admin access to keep match
              records up to date.
            </p>
          </Section>

          <Section title="What we store">
            <p>
              Player names or nicknames (with an initial or surname only where needed to tell two
              players apart), playing position, which matches each player took part in and for which
              team, goals scored, and match results.
            </p>
            <p>
              We also calculate statistical ratings from match results. These are visible only to
              the group&apos;s admins, and they are a recreational estimate, not an assessment of
              anyone&apos;s football ability.
            </p>
            <p>
              We don&apos;t collect contact details, dates of birth, addresses or any other personal
              information about players.
            </p>
          </Section>

          <Section title="Why we store it">
            <p>
              To keep a record of MNF matches and statistics for the group. We rely on legitimate
              interests: the information is limited to recreational football, kept within the group,
              and is the kind of record members would reasonably expect.
            </p>
          </Section>

          <Section title="Who can see it">
            <p>
              Only MNF members with the group&apos;s access code, and the group&apos;s admins, who
              can also correct player and match records. The data is not public, and the site asks
              search engines not to index it.
            </p>
          </Section>

          <Section title="Where it's kept">
            <p>
              The app and its database are hosted on Microsoft Azure in the UK (UK South region).
              Admins sign in with Google, so Google processes their sign-in.
            </p>
          </Section>

          <Section title="Cookies and tracking">
            <p>
              We don&apos;t use analytics, advertising or tracking of any kind. Your browser stores
              a single access token after you enter the code, so you don&apos;t have to re-enter it
              each visit. It expires after 30 days.
            </p>
          </Section>

          <Section title="Feedback">
            <p>
              Feedback is collected through a Google Form run by a dedicated MNF Google account, and
              responses are stored in that account. The form doesn&apos;t collect your email address
              or require you to sign in, so feedback is anonymous unless you choose to include your
              name.
            </p>
          </Section>

          <Section title="How long we keep it">
            <p>
              For as long as MNF runs. Players who stop coming stay in the records so that past
              match history remains accurate, and so their stats are still there if they return.
            </p>
          </Section>

          <Section title="Your choices">
            <p>
              You can ask to see what&apos;s held about you, to correct it, to be hidden, or to be
              removed. If you&apos;re removed, past matches will show you as &ldquo;Former
              Player&rdquo; so the results still add up.
            </p>
            <p>
              Message Kobi in the MNF group chat or email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-pitch hover:opacity-80">
                {CONTACT_EMAIL}
              </a>
              . We&apos;ll respond well within one month.
            </p>
            <p>
              If you&apos;re unhappy with how your information is handled, you can also complain to
              the Information Commissioner&apos;s Office (ico.org.uk).
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
