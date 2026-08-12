# M1 — Project Foundation

## PR 1 — Scaffold Next.js Frontend

- Create the Next.js + TypeScript project using Yarn.
- Use the App Router.
- Configure linting and formatting.
- Establish the initial route/layout structure.
- Add global styles and Tailwind CSS.
- Add the initial Jest test setup.

## PR 2 — Base UI and Application Shell

- Add shadcn/ui or equivalent reusable primitives.
- Establish shared UI conventions for:
  - buttons
  - inputs
  - cards
  - dialogs
  - typography
  - spacing
- Create the base authenticated application shell.
- Add shared navigation/layout components.
- Add loading, empty, and error-state patterns.

## PR 3 — API Client, TanStack Query, and CI

- Add shared API client utilities.
- Configure credentialed requests for the separately deployed NestJS API.
- Configure TanStack Query.
- Add global query/error conventions.
- Add React Testing Library.
- Add Playwright test foundation.
- Add GitHub Actions for install, lint, test, and build.
- Document required frontend environment variables.

### Frontend Environment Variables

- `NEXT_PUBLIC_API_URL` (required): Base URL of the separately deployed NestJS API.
- `PLAYWRIGHT_BASE_URL` (optional): Base URL override for Playwright E2E runs.
