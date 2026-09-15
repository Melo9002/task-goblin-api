# Task Goblin 👺

**Serious tasks. Questionable goblin methods.**

A compact full-stack task manager: React + Vite on the front, Java 21 + Spring Boot underneath. Give the goblin a task, add a deadline, and bonk it done. Every playful action includes its plain-language meaning.

![The guild's original mascot artwork](frontend/public/assets/workshop.svg)

## What it does

- Create, edit, delete, complete and reopen tasks.
- Three statuses, three priorities, optional due dates and overdue indicators.
- Server-side search, combined filters, stable sorting and bounded pagination.
- A goblin that reacts to your workload; Cave Mode (Dark Mode).
- Keyboard controls, mobile layouts and reduced-motion support.
- Persistent H2 storage locally; PostgreSQL profile and Docker Compose configuration.
- Validated request DTOs, structured HTTP errors, optimistic concurrency and Flyway migrations.
- Live Swagger/OpenAPI documentation.
- A separate, clearly labeled browser-storage demo suitable for GitHub Pages.

## Run on Windows

Requires **JDK 21** and **Node.js 22.12+ with npm**. Maven is supplied by the wrapper.

~~~powershell
.\dev.ps1
~~~

Open **http://127.0.0.1:8080**. API documentation: **http://127.0.0.1:8080/swagger-ui/index.html**. Stop with Ctrl+C.

The script installs frontend dependencies, builds React, and starts Spring Boot. A machine-specific, Git-ignored .local-tools.ps1 can supply portable tool paths. On the prepared local checkout, this file is already configured; keep its referenced toolchain folder if you relocate the project.

If PowerShell blocks the script, open it for review and use the manual commands below; no execution-policy changes are needed.

### Manual / macOS / Linux

~~~sh
cd frontend
npm ci
npm run build
cd ..
./mvnw spring-boot:run
~~~

On Windows, use .\mvnw.cmd instead of ./mvnw.

For frontend hot reload, start the API in one terminal and Vite in another:

~~~powershell
.\dev.ps1 -Action api
# In another terminal:
.\dev.ps1 -Action frontend
~~~

Vite serves http://127.0.0.1:5173 and proxies /tasks to Spring Boot. The packaged app serves React itself, so it needs only one server.

## Test and package

~~~powershell
.\dev.ps1 -Action test
.\dev.ps1 -Action build
~~~

Or run npm test and npm run build in frontend/, followed by ./mvnw verify at the repository root. Java integration tests exercise the real service and database through MockMvc. Node tests exercise filtering, date rules, mascot states and the demo persistence adapter.

The executable jar is target/taskgoblin-1.0.0-SNAPSHOT.jar:

~~~sh
java -jar target/taskgoblin-1.0.0-SNAPSHOT.jar
~~~

## API

| Method | Path | Purpose |
|---|---|---|
| POST | /tasks | Create; returns 201 and Location |
| GET | /tasks | Paginated, filtered list |
| GET | /tasks/summary | Overall and overdue counts |
| GET | /tasks/{id} | Read one |
| PUT | /tasks/{id} | Edit or change status, with version |
| PUT | /tasks/{id}/done | Idempotent completion action |
| DELETE | /tasks/{id}?version=0 | Delete with stale-edit protection |

Example create body:

~~~json
{"title":"Polish the portfolio","description":"Give the goblin its moment.","priority":"HIGH","status":"TODO","dueDate":"2026-09-18"}
~~~

Example query: /tasks?completed=false&priority=HIGH&page=0&size=12&sort=dueDate,asc

The list response is { items, page, size, totalItems, totalPages }. This replaces the original MVP's bare array. Sizes are 1–100; page numbers start at zero. Optional filters: q, status, completed, priority and dueBefore (inclusive). Sort fields: createdAt, updatedAt, title, priority and dueDate. Priority ascending puts HIGH first; undated tasks sort last.

Updates require title, priority, status and the latest version. Omit or null dueDate to clear it. Errors use application/problem+json: 400 for invalid requests, 404 for missing tasks, 409 for stale versions. Swagger includes schemas and examples.

## Data and deployment

Local tasks live in data/taskgoblin.mv.db, ignored by Git. Stop the application before copying that file for a backup. Tests use a separate in-memory database. H2's web console is disabled.

For local PostgreSQL with Docker, copy .env.example to .env, choose a password, then run:

~~~sh
docker compose up --build
~~~

Compose stores PostgreSQL data in a named volume and exposes only the app, on host loopback port 8080. The prod Spring profile accepts DATABASE_URL (a jdbc:postgresql: URL), DATABASE_USER and DATABASE_PASSWORD. Docker and PostgreSQL runtime verification require those tools; see docs/QA.md for the recorded validation status.

This is a single-user local application, not an authenticated public service. The Pages demo is the intended public portfolio surface; it stores each visitor's data only in their own browser.

## Learn and publish

- [Code tour and interview practice](docs/HOW_IT_WORKS.md)
- [Push it yourself and publish the Pages demo](docs/GITHUB_PAGES.md)
- [Architecture and tradeoffs](docs/ARCHITECTURE.md)
- [Validation and manual checks](docs/QA.md)

The Java project stays at the repository root to preserve its history. React lives in frontend/. No microservice zoo required.
