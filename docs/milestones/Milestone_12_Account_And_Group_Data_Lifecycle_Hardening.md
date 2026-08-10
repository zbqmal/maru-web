# M12 — Account and Group Data Lifecycle Hardening

## PR 1 — Account Deletion UX

- Add Delete Account in profile/settings.
- Clearly explain permanent removal of diary data and related content.
- Add strong confirmation.
- Integrate account deletion API.
- Handle leadership-transfer consequences surfaced by the backend.
- Clear local/query state after successful deletion.
- Redirect to an unauthenticated page.
- Add tests.

## PR 2 — Group Destructive Flow Hardening

- Revisit Delete Group and Leave Group UX after diary/media/comments exist.
- Clearly explain which content will be permanently removed.
- Ensure leader-specific states are understandable.
- Handle backend deletion/cleanup failures gracefully.
- Refresh all group-related query caches after success.
- Add tests.
