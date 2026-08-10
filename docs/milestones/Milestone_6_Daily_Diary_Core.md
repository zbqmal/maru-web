# M6 — Daily Diary Core

## PR 1 — Today's Diary Page and Daily Context

- Build the main **Today's Diary** page.
- Fetch today's diary context for the selected group.
- Render the active custom questions.
- Render the selected group header and member sidebar.
- Handle no-question and loading/error states.
- Add tests for rendering the returned daily context.

## PR 2 — Question Expand/Collapse Interaction

- Render questions collapsed by default.
- Expand a question when selected.
- Show the answer input inside the expanded card.
- Do not show an emoji-add button.
- Do not use placeholder text in the answer input.
- Add the `Answer` button.
- Collapse completed questions after successful submission.
- Show a completion checkmark.
- Allow completed questions to be reopened for editing.
- Add component tests for all interaction states.

## PR 3 — Answer Create and Edit Integration

- Integrate answer creation.
- Integrate answer update.
- Reflect saved answers in TanStack Query state/cache.
- Handle optimistic UI only where rollback is safe.
- Prevent duplicate submissions.
- Handle server validation and authorization errors.
- Add integration tests with API mocking.

## PR 4 — Group Daily Feed

- Fetch selected-date group diary entries.
- Render one diary card per member/entry.
- Display submitted answers clearly.
- Support:
  - no entry
  - partial entry
  - completed entry
- Keep private group content scoped to the selected group.
- Add loading and empty states.
- Add tests for multi-member feed rendering.
