# Dayflow

A responsive todo frontend with a production-oriented Node.js backend foundation and a structured backend learning roadmap.

## Current status

- **Frontend:** Next.js 16.4.0, React 19.3.0, shadcn/ui, Tailwind and Axios. Login/register/logout screens, task creation/edit/delete/completion, search, filters, priorities, due dates, progress, responsive layouts and error states are implemented.
- **Backend foundation:** validated configuration, PostgreSQL pool/transactions, optional Redis lifecycle, standard responses, centralized errors, structured logs, health/readiness probes and graceful shutdown are implemented.
- **Learning work:** real authentication, authorization, CSRF/rate limits, todo services/repositories and application migrations remain unfinished. Feature endpoints return 501.

**The full application is not production-ready until the documented learning and release checklists are complete.**

## Repository structure

```text
Nodejs/
├── .gitignore
├── README.md
├── frontend/
│   ├── .env.example                 # API URL and explicit demo switch
│   ├── package.json / package-lock.json
│   ├── README.md
│   └── src/
│       ├── app/                     # Dashboard, auth pages, route/global error boundaries
│       ├── components/              # Auth form and generated shadcn/ui components
│       └── lib/                     # Axios contracts, demo adapter and types
├── backend/
│   ├── .env.example                 # PostgreSQL, optional Redis and process settings
│   ├── README.md                    # Complete backend file tree and status
│   ├── IMPLEMENTATION.md            # Reading/implementation order
│   ├── docs/                        # API, architecture, configuration, learning, operations, Redis
│   ├── db/migrations/               # Application schema exercise
│   ├── scripts/                     # DB connectivity and syntax checks
│   ├── src/                         # Config, routes, controllers, services, repositories,
│   │                                # middleware, validators and shared utilities
│   └── tests/                       # Unit, HTTP and opt-in PostgreSQL tests
└── docs/
    ├── README.md
    ├── VERIFICATION.md
    └── dashboard-preview.jpg
```

See [backend/README.md](backend/README.md) for the exhaustive backend structure and folder responsibilities.

## Run the frontend

```sh
cd frontend
npm ci
# Fresh checkout only; preserve an existing configured file.
cp -n .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000). Demo mode explicitly bypasses real authentication: any valid email/password can be used, passwords are not stored or checked, and tasks are stored by email in this browser's localStorage. The demo session is stored in sessionStorage. Do not use demo mode for sensitive data.

## Run the backend

```sh
cd backend
npm ci
cp -n .env.example .env
# Set a valid DATABASE_URL before continuing.
npm run db:check
npm run dev
```

PostgreSQL must be reachable before HTTP starts. Redis is disabled by default. The backend does not provision roles/databases or run application migrations automatically. Read [configuration](backend/docs/CONFIGURATION.md).

## Learn and connect

1. Read the [backend API contract](backend/docs/API.md).
2. Follow the [learning milestones](backend/docs/LEARNING.md).
3. Implement and test authentication, security and todo behavior.
4. Set `NEXT_PUBLIC_DEMO_MODE=false` in `frontend/.env.local`, verify the API URL and restart/rebuild Next.js.
5. Complete the [release checklist](backend/docs/OPERATIONS.md#release-checklist).

The real Axios client and demo adapter share the same response envelope. Real mode never silently falls back to demo mode.

## Validation

Backend: `npm run check`, `npm test`, `npm run db:check`, optional `npm run test:db`.
Frontend: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

See [verification notes](docs/VERIFICATION.md) for checks actually performed and outstanding limitations. Review dependency audits for backend, frontend runtime and build tooling separately.
