# M14 — Production Hardening and Scale

M14 should be implemented as focused PRs based on measured frontend needs rather than as one speculative milestone-sized change.

## Candidate PR — Performance and Bundle Review

- Run bundle analysis.
- Remove unnecessary client-side dependencies.
- Reduce `"use client"` boundaries where practical.
- Dynamically load genuinely heavy UI.
- Measure key route performance before and after changes.

## Candidate PR — TanStack Query Tuning

- Review stale times and invalidation behavior.
- Remove redundant requests.
- Add pagination/infinite-query patterns where backend data volume requires them.
- Avoid duplicating server state in Zustand/local component state.

## Candidate PR — Image Performance

- Review image dimensions and loading behavior.
- Add responsive image sizing.
- Lazy-load non-critical images.
- Improve gallery performance for photo-heavy diary feeds.

## Candidate PR — Error Monitoring

- Add Sentry or selected frontend telemetry.
- Capture route/render/API failures without leaking sensitive content.
- Add useful release/environment metadata.

## Candidate PR — Accessibility and Responsive Polish

- Complete keyboard navigation review.
- Review form labels and dialog focus management.
- Validate color contrast.
- Polish mobile/tablet layouts.
- Test supported browsers.

## Candidate PR — Frontend Load/E2E Coverage

- Expand Playwright coverage for critical user journeys.
- Cover:
  - authentication
  - invitation acceptance
  - group switching
  - answering daily questions
  - photo upload
  - calendar navigation
  - comments/reactions
  - destructive account/group flows
- Keep tests deterministic and independent where practical.
