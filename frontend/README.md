# Dayflow frontend

Next.js 16.4.0, React 19.3.0, Tailwind 4, generated shadcn/ui (Base UI), Axios.

## Start

```sh
npm ci
# Fresh checkout only; do not replace an existing configured file.
cp -n .env.example .env.local
npm run dev
```

Demo mode is an explicitly labelled browser-only preview, not real authentication. It does not verify or store passwords. Set `NEXT_PUBLIC_DEMO_MODE=false` and restart/rebuild the frontend after implementing the backend features.

## Source layout

- `src/app/page.tsx`: authenticated workspace UI, client-side task views and mutations.
- `src/app/login` and `src/app/register`: authentication pages.
- `src/app/error.tsx`: route rendering error boundary with retry.
- `src/app/global-error.tsx`: root-layout fallback with its own HTML/body.
- `src/app/not-found.tsx`: friendly missing-page UI.
- `src/components/auth-form.tsx`: shared login/registration form.
- `src/components/ui`: generated shadcn components.
- `src/lib/api.ts`: credentialed Axios client and shared response types.
- `src/lib/demo-adapter.ts`: explicit browser-only Axios adapter using the same envelope.
- `src/lib/types.ts`: user/todo DTOs.

Error boundaries cover rendering failures. Request and event-handler failures use the existing try/catch feedback; they are not automatically caught by React error boundaries. Raw exceptions are never displayed to users. Current Next.js 16.4 error files receive `retry`; follow installed documentation when upgrading.

## API response contract

Success: `{ success: true, message, data, meta: { requestId, timestamp } }`.
Failure: `{ success: false, data: null, error: { code, message, details }, meta }`.

The frontend reads resources from `response.data.data` and messages from `response.data.error.message`. Real mode uses HttpOnly backend cookies through Axios `withCredentials`; it does not store authentication tokens in localStorage.

See the [backend API contract](../backend/docs/API.md) and [root README](../README.md).

## Checks

`npm run lint`, `npx tsc --noEmit`, `npm run build`.

Before release, disable demo mode, run real end-to-end tests, verify cookie/CORS settings and review both runtime and build-tool dependency advisories.
