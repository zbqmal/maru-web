# Copilot Instructions

## Stack

- Next.js with App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- TanStack Query for server state
- Zustand only when lightweight global client state is needed

## Package Manager

- Use **Yarn** only.
- Do not use npm or pnpm commands.

## Testing

- **Unit:** Jest
- **Component / integration:** Jest + React Testing Library
- **API mocking in tests:** MSW when needed
- **E2E:** Playwright

## Deployment

- Deploy the frontend to Vercel.
- The NestJS backend is a separately deployed API; do not implement backend business logic in Next.js API routes or Server Actions.

## Development Guidelines

- Use TypeScript strictly; avoid `any`.
- Prefer Server Components unless client-side interactivity requires `"use client"`.
- Keep components small and reusable.
- Follow existing project patterns before introducing new abstractions.
- Do not add dependencies unless they are clearly necessary.
- Keep API/server state in TanStack Query rather than duplicating it in global client state.
- Add or update tests for meaningful behavior changes.
- When `maru-api` updates `docs/api-contracts`, run `yarn api-contract:sync` and keep `docs/api-contracts` checked in here.

# Frontend Implementation PR Guidelines (Not Planning PR)

- Prefer one coherent user-facing capability per PR.
- A PR may include UI, API integration, query handling, and tests when they all belong to the same capability.
- Do not split tiny visual details into separate PRs solely to reduce PR size.
- Do not combine unrelated screens or flows just because they belong to the same milestone.
- Reuse existing shared components before creating new abstractions.
- Keep backend business logic out of Next.js API routes and Server Actions; the NestJS API is the source of truth.
- Keep server state in TanStack Query rather than duplicating it in global client state.
- Add component/integration tests with meaningful behavior changes.
- Add Playwright coverage for critical cross-page flows when the feature becomes stable enough for E2E testing.
- Every merged PR should leave the frontend buildable and deployable to Vercel.
