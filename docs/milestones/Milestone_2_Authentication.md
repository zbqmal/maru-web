# M2 — Authentication, Account Recovery, and Profile

## PR 1 — Login and Registration UI

- Build `/login`.
- Build `/register`.
- Add email/password form validation.
- Integrate registration API.
- Integrate login API.
- Handle server validation errors.
- Redirect authenticated users appropriately.
- Add component/integration tests for both forms.

## PR 2 — Authenticated Session Handling

- Add current-user query.
- Add authenticated/unauthenticated route handling.
- Ensure API requests include credentials/cookies.
- Add logout.
- Add authenticated navigation/profile menu.
- Handle expired sessions gracefully.
- Add tests for authenticated and unauthenticated states.

## PR 3 — Forgot and Reset Password

- Build `/forgot-password`.
- Integrate forgot-password API.
- Add neutral success messaging that does not expose account existence.
- Build `/reset-password`.
- Read/reset token from the reset link.
- Integrate password reset API.
- Handle invalid/expired/reset-complete states.
- Add tests for the recovery flow.

## PR 4 — Home Shell

- Build the initial `/home` page shell.
- Add the main dashboard layout.
- Add sidebar/navigation structure.
- Add profile access.
- Add an empty state for users with no groups.
- Keep diary/group-specific sections as placeholders until later milestones.
- Add basic responsive behavior.

## PR 5 — Profile Page

- Build `/profile`.
- Display:
  - name
  - email
  - birthday
  - profile image placeholder/reference
- Integrate profile retrieval.
- Integrate name and birthday updates.
- Keep profile image controls disabled or deferred until media support exists.
- Add update success/error states.
- Add tests for profile editing.
