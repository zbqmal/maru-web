# M4 — Email Group Invitations

## PR 1 — Invite Member UI

- Add leader-only Invite Member dialog.
- Accept an email address.
- Integrate invitation creation API.
- Show sending/loading/success/error states.
- Prevent duplicate submissions while a request is active.
- Add tests for leader/member access and form behavior.

## PR 2 — Invitation Landing and Acceptance

- Build the invitation route/page.
- Read the invitation token from the URL.
- Fetch invitation state/metadata.
- Handle:
  - valid invitation
  - invalid invitation
  - expired invitation
  - already-used invitation
- Preserve the invitation destination when redirecting unauthenticated users to Login/Register.
- Integrate invitation acceptance.
- Redirect to the joined group after success.
- Add Playwright coverage for the full invitation flow when backend support is available.
