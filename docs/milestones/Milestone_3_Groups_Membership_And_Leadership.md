# M3 — Groups, Membership, and Leadership

## PR 1 — Group Creation and Group Selector

- Build the Create Group flow.
- Integrate group creation API.
- Fetch the current user's groups.
- Add the group selector above the main diary area.
- Persist/select the active group using the simplest existing app-state pattern.
- Handle users with one, multiple, or zero groups.
- Add loading/error/empty states.
- Add integration tests.

## PR 2 — Selected Group Header and Member Sidebar

- Display selected group information.
- Fetch and render group members.
- Show member avatars/placeholders.
- Show the group leader indicator.
- Replace any placeholder "groups" sidebar content with the selected group's members.
- Keep layout consistent across Home, Calendar, and Question Settings pages.
- Add component/integration tests.

## PR 3 — Group Settings

- Build group settings UI.
- Allow the leader to update group information supported by the backend.
- Hide or disable leader-only actions for normal members.
- Add clear authorization/error states.
- Add tests for leader/member rendering.

## PR 4 — Leave Group and Leadership Transfer

- Add Leave Group flow.
- If the user is leader, support the leadership-transfer UX required by the backend behavior.
- Show a successor-selection UI when explicit transfer is available.
- Handle automatic fallback behavior gracefully if the backend applies it.
- Refresh group state after leaving.
- Redirect to another group or the no-group Home state.
- Add tests for member and leader leave flows.

## PR 5 — Delete Group

- Add leader-only Delete Group action.
- Show strong destructive confirmation.
- Require entering the group name or equivalent explicit confirmation.
- Integrate group deletion API.
- Refresh group list after deletion.
- Redirect appropriately.
- Add tests for confirmation and leader-only access.

---
