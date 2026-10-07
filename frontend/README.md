# MNF Manager — Frontend

Next.js 16 (App Router) with TypeScript, Tailwind CSS and React Query.

## Running locally

```bash
npm ci
npm run dev        # http://localhost:3000
```

The backend should be running on `http://localhost:8080`.

## Configuration

Create `.env.local` (gitignored):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_DEMO_API_URL=http://localhost:8081   # optional: enables "Try the demo"
```

`NEXT_PUBLIC_*` values are baked in at build time, not read at runtime. Restart
`npm run dev` after changing them; in production they're passed to the Docker
build as build arguments.

## Structure

- `app/`: pages (App Router), with signed-in pages under `app/(dashboard)/`
- `components/`: shared UI, including `components/draft/` and `components/demo/`
- `lib/api.ts`: the Axios client. Attaches the stored token, and routes requests
  to the demo backend while in demo mode
- `lib/access.ts`, `lib/auth.tsx`: member and admin tokens
- `lib/demo.ts`: entering and leaving the demo

## Access and demo mode

Members enter a shared access code; admins sign in with Google. Demo mode is
decided by who is signed in (the demo user), not by a separate flag, so signing
out or entering the real access code always ends it. Entering and leaving the
demo reload the page, so cached data never crosses between the real and demo
backends.

## Fonts

Fonts are self-hosted in `app/fonts/` with `next/font/local` rather than loaded
from Google Fonts, which intermittently broke Turbopack builds
(vercel/next.js#99114). They're the latin subsets, under the SIL Open Font
License.

## Checks

```bash
npm run lint
npm run build
```
