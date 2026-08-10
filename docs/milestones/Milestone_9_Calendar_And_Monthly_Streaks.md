# M9 — Calendar and Monthly Streaks

## PR 1 — Monthly Calendar UI

- Build the **Calendar** page.
- Render a monthly calendar.
- Add previous-month navigation.
- Add next-month navigation.
- Fetch monthly activity for the selected group.
- Show a checkmark on dates where the current user recorded.
- Show a fire indicator on dates where all group members recorded.
- Add a clear legend explaining both indicators.
- Highlight the selected date.
- Add tests for monthly navigation and indicator rendering.

## PR 2 — Selected-Date Records

- Fetch diary records for the selected calendar date.
- Display the selected date clearly below/near the calendar.
- Render that day's group diary cards.
- Handle dates with no records.
- Reuse diary-feed components where practical.
- Add tests for date selection and feed updates.

## PR 3 — Monthly Streak Summary

- Display the current monthly streak returned by the backend.
- Keep streak UI scoped to the current month rather than an unbounded historical streak.
- Handle month changes correctly.
- Add tests for streak display.
