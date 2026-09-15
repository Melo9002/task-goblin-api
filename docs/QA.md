# Browser acceptance checks

Start the application with a separate test database when testing destructive actions. Example:

```powershell
$env:TASK_GOBLIN_DB_URL = 'jdbc:h2:file:./data/qa-guild;DB_CLOSE_ON_EXIT=FALSE'
.\dev.ps1
```

- Empty board shows all three goblins and a sample-quest option.
- Sample quests are real records; the option disappears after creation.
- Create a task, reload, and verify that the title and details remain.
- Edit the title, details, and priority; reopen the editor to check them.
- Move through each status with the native select; verify counts and gold.
- Reopen a completed task; gold decreases by ten. Completing again restores ten.
- Drag a task between columns on desktop; confirm the result after reload.
- Search title and details, combine with a priority filter, then clear the filters.
- Verify newest, oldest, and priority sorting.
- Open the same task in two tabs; save in one, then try the stale edit in the other. It must show a conflict and preserve the newer record.
- Cancel deletion, then delete a disposable test task and verify its disappearance.
- With the server stopped, refresh the board. It should display a connection error, not an empty success state.
- Restart the same database and check that previously saved tasks remain.
- Check keyboard shortcuts N and /, Tab navigation, dialog focus, and Escape.
- Check a 390px mobile viewport and a desktop viewport; no horizontal page overflow.
- Check the crew and handbook dialogs and browser console for errors.

Automated API and board-model coverage is described in `ARCHITECTURE.md`.

## Recorded validation

Last full pass: September 14, 2026.

- `mvn verify`: 16 Spring tests passed (15 API tests and 1 application-context test).
- `npm test`: 7 frontend domain and demo-store tests passed.
- Production frontend build and the combined Spring Boot package completed successfully.
- The live full-stack UI was checked in a desktop browser: create, due date, status changes, complete/reopen, persisted totals, filters, and Cave Mode behaved as expected.
- The layout was checked at 390 x 844: no horizontal overflow was present.
- The GitHub Pages build loaded from `/task-goblin-api/`, displayed the browser-demo notice, and produced no browser console warnings or errors.

Docker/PostgreSQL remains an environment check for a machine with Docker available; the same PostgreSQL profile is exercised by the repository configuration and migrations.
