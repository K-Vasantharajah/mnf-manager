import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Providers from './providers';
import DemoBanner from '@/components/demo/DemoBanner';

// Self-hosted rather than next/font/google: Google Fonts sometimes returns URLs
// that break Turbopack builds (vercel/next.js#99114). Files are the latin subset
// from Fontsource, licensed under the SIL Open Font License (see app/fonts).

const fraunces = localFont({
  src: [
    { path: './fonts/fraunces-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/fraunces-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: './fonts/fraunces-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/fraunces-latin-500-italic.woff2', weight: '500', style: 'italic' },
    { path: './fonts/fraunces-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/fraunces-latin-600-italic.woff2', weight: '600', style: 'italic' },
  ],
  variable: '--font-fraunces',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

const spaceGrotesk = localFont({
  src: [
    { path: './fonts/space-grotesk-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/space-grotesk-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/space-grotesk-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/space-grotesk-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-space-grotesk',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

const ibmPlexMono = localFont({
  src: [
    { path: './fonts/ibm-plex-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/ibm-plex-mono-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: 'MNF Manager',
  description: 'Monday Night Football analytics platform',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <Providers>
          <DemoBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
