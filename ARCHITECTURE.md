# CampusFix — Architecture

**Version:** 1.0  
**Status:** MVP  
**Source of truth:** PRD.md v1.0  
**Last Updated:** 2026-09-24

---

## 1. Architecture Overview

CampusFix is a traditional server-rendered web application with a thin layer of client-side JavaScript only where necessary (upvote toggle, search/filter without full-page reload). There is no separate frontend framework and no SPA. Jinja2 templates render HTML on the server; Flask handles all routing, business logic, and database access.

**Why this is the right shape for this project:**  
The PRD explicitly lists Jinja2 templates and plain HTML/CSS/minimal JS. A React or Vue frontend would require a build toolchain, a separate API layer, CORS configuration, and a much steeper ramp for a beginner/intermediate student. The server-rendered approach eliminates all of that while still producing a fully functional, usable application.

**High-level request path:**

```
Browser (Student or Admin)
    ↓  HTTP request (form POST or GET with query params)
Flask Application (routes, auth check, business logic)
    ↓  SQL query via SQLite3 / SQLAlchemy
SQLite Database (single .db file on disk)
    ↓  query result
Flask (render Jinja2 template with data)
    ↓  HTML response
Browser (displays rendered page)
```

**Image uploads** are handled by Flask during the request, saved to a local folder (`/static/uploads/`), and served as static files by Flask during development. No object storage, no CDN, no external service. The file path is stored in the `issues` table as a relative URL string.

---

## 2. System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│   Student Browser                    Admin Browser              │
│   ┌─────────────┐                   ┌─────────────┐            │
│   │ HTML pages  │                   │ HTML pages  │            │
│   │ (Jinja2)    │                   │ (Jinja2)    │            │
│   │ + plain CSS │                   │ + plain CSS │            │
│   │ + minimal JS│                   │ + minimal JS│            │
│   └──────┬──────┘                   └──────┬──────┘            │
└──────────┼───────────────────────────────── ┼──────────────────┘
           │ HTTP (GET / POST)                 │ HTTP (GET / POST)
           ▼                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FLASK APPLICATION                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Routes / Views                      │   │
│  │                                                          │   │
│  │  /            Issue listing + search + filter            │   │
│  │  /issues/<id> Issue detail page                          │   │
│  │  /report      New issue form (auth required)             │   │
│  │  /upvote/<id> Upvote toggle (auth required)              │   │
│  │  /profile     Student profile + tracked issues (auth)    │   │
│  │  /login       /register   /logout                        │   │
│  │  /admin/      Admin dashboard (admin role required)      │   │
│  │  /admin/issues/<id>/update  Status + remark (admin)      │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │                  Authentication Layer                     │   │
│  │   Flask-Login   Session cookie   Role check (is_admin)   │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │               Business Logic / Helpers                   │   │
│  │   Impact score computation   File validation             │   │
│  │   Upvote toggle logic        Input sanitization          │   │
│  └──────────┬─────────────────────────────┬─────────────────┘   │
│             │                             │                     │
│             ▼                             ▼                     │
│  ┌─────────────────────┐    ┌─────────────────────────────┐     │
│  │  SQLite Database    │    │  Local File Storage          │     │
│  │  campusfix.db       │    │  /static/uploads/            │     │
│  │                     │    │  (served by Flask as static) │     │
│  │  users              │    │  2 MB max per file           │     │
│  │  issues             │    │  Allowed: jpg, png, webp     │     │
│  │  upvotes            │    └─────────────────────────────┘     │
│  │  issue_remarks      │                                        │
│  └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Planned Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend templates | Jinja2 (built into Flask) | Server-rendered HTML; no build step, no separate framework needed |
| Frontend styling | Plain CSS (single stylesheet) | Sufficient for MVP; avoids Tailwind/Bootstrap setup overhead |
| Frontend interactivity | Vanilla JavaScript (minimal) | Upvote toggle fetch call and filter form submission; nothing more needed |
| Backend | Python 3.x + Flask | Specified in PRD; lightweight, well-documented, beginner-friendly |
| ORM / DB access | SQLAlchemy (Flask-SQLAlchemy) | Prevents raw SQL injection risk; straightforward models; easy to migrate later |
| Database | SQLite (single `.db` file) | Zero-config, file-based, sufficient for ≤ 100 concurrent users at MVP scale |
| Authentication | Flask-Login | Standard Flask auth extension; handles sessions, `current_user`, and `@login_required` |
| Password hashing | Werkzeug `generate_password_hash` / `check_password_hash` | Already bundled with Flask; no extra dependency |
| File/image storage | Local disk — `/static/uploads/` | Zero-config for MVP; Flask serves it as a static directory |
| Hosting | Local machine or any shared host with Python support (e.g. PythonAnywhere) | No cloud infra required; matches PRD deployment target |

---

## 4. Request / Data Flow

### A. Student views issues (GET /)

```
1. Browser sends GET / (with optional query params: ?q=fan&category=Electrical&status=Open)
2. Flask route handler reads query params
3. SQLAlchemy query: SELECT issues + computed impact_score, filtered + sorted DESC by impact_score
   impact_score = (upvote_count * 3) + (severity_weight * 5) + min(days_open, 30)
   This is computed in Python after fetching rows, not in SQL, for simplicity
4. If user is logged in (Flask-Login current_user), also fetch the set of issue IDs the user has upvoted
   (used to render "already upvoted" state on each card)
5. Flask renders issues/list.html with the result list
6. Browser displays the page — no JS required for this view
```

### B. Student creates an issue (POST /report)

```
1. Browser sends GET /report → Flask checks @login_required → renders report form
2. Student fills form and submits POST /report (multipart/form-data for image)
3. Flask validates:
   - title: required, max 120 chars
   - description: required, max 2000 chars
   - category: must be one of the allowed enum values
   - location: required, max 100 chars
   - severity: must be Low / Medium / High
   - image (if present): extension must be jpg/jpeg/png/webp, size ≤ 2 MB
4. On validation failure: re-render form with error messages (no redirect)
5. On validation pass:
   a. If image present: save to /static/uploads/<uuid>.<ext>, store relative path
   b. INSERT new row into issues table (reporter_id = current_user.id, status = 'Open')
   c. Commit transaction
6. Redirect to /issues/<new_id> (POST-Redirect-GET pattern prevents double submit)
7. Browser loads the issue detail page
```

### C. Student upvotes an issue (POST /upvote/<id>)

```
1. Student clicks upvote button on listing or detail page
2. Minimal JS sends POST /upvote/<issue_id> (fetch, JSON response)
3. Flask checks @login_required (returns 401 JSON if not logged in)
4. Flask validates:
   - issue exists (404 if not)
   - current_user.id != issue.reporter_id (cannot upvote own issue)
5. Check if upvote row already exists for (user_id, issue_id):
   - If NOT exists: INSERT into upvotes; return {"action": "added", "count": N}
   - If exists:     DELETE from upvotes; return {"action": "removed", "count": N}
6. JS updates the upvote count display and toggles button state — no full page reload
```

### D. Admin updates issue status (POST /admin/issues/<id>/update)

```
1. Admin is on the issue detail page, fills the status update form
2. Browser sends POST /admin/issues/<id>/update
3. Flask checks @login_required AND current_user.is_admin (403 if either fails)
4. Flask validates:
   - new_status: must be Open / In Progress / Resolved
   - remark: optional, max 500 chars
5. UPDATE issues SET status = new_status WHERE id = <id>
6. If remark provided: INSERT into issue_remarks (issue_id, admin_id, remark, created_at)
7. Commit transaction
8. Redirect to /issues/<id> (POST-Redirect-GET)
9. Browser reloads detail page showing updated status and new remark
```

---

## 5. Authentication and Authorization

### Student Authentication

Students register with name, email, and password. Passwords are hashed with Werkzeug's `generate_password_hash` (pbkdf2:sha256) before being stored — the plaintext password is never saved. On login, `check_password_hash` compares the submitted password against the stored hash. Flask-Login creates a server-side session and sets an encrypted session cookie.

### Admin Authentication

Admin accounts are not self-registerable. They are created by running a Flask CLI command (`flask seed-admin`) or a one-time seed script that inserts a row into the `users` table with `is_admin = True`. The login form is the same `/login` route — Flask-Login handles it identically; the role check happens at the route level.

### Role Representation

The `users` table has a single boolean column `is_admin` (default `False`). There is no separate roles table for MVP. Admins are identified by `user.is_admin == True`.

### Route Authorization Summary

| Route | Auth required | Admin required |
|---|---|---|
| `GET /` | No | No |
| `GET /issues/<id>` | No | No |
| `GET /login`, `GET /register` | No | No |
| `POST /login`, `POST /register` | No | No |
| `GET /report`, `POST /report` | Yes | No |
| `POST /upvote/<id>` | Yes | No |
| `GET /profile` | Yes | No |
| `GET /admin/` | Yes | Yes |
| `POST /admin/issues/<id>/update` | Yes | Yes |

Flask-Login's `@login_required` decorator handles the "auth required" check (redirects to `/login`). A separate `@admin_required` decorator (a simple custom decorator wrapping `@login_required`) checks `current_user.is_admin` and returns 403 if false.

---

## 6. Core Entities

### User

Represents both students and administrators. Differentiated by `is_admin`.

| Field | Type | Notes |
|---|---|---|
| `id` | Integer, PK, autoincrement | |
| `name` | String(100), not null | Display name shown on issues |
| `email` | String(200), unique, not null | Used for login; kept private from other students |
| `password_hash` | String(256), not null | Werkzeug hash; never plaintext |
| `is_admin` | Boolean, default False | True only for seeded admin accounts |
| `created_at` | DateTime, default now | |

**Relationships:** One user → many issues (as reporter). One user → many upvotes.

---

### Issue

The central entity. Every complaint is one row here.

| Field | Type | Notes |
|---|---|---|
| `id` | Integer, PK, autoincrement | |
| `title` | String(120), not null | |
| `description` | Text, not null | |
| `category` | String(50), not null | Enum: Electrical, Plumbing, Furniture, Wi-Fi, Washroom, Lab Equipment, Hostel, Other |
| `location` | String(100), not null | Free text: "Room 204, Main Block" or from a short dropdown |
| `severity` | String(10), not null | Enum: Low, Medium, High |
| `status` | String(20), default 'Open' | Enum: Open, In Progress, Resolved |
| `image_path` | String(300), nullable | Relative path: `uploads/<uuid>.jpg`; None if no image |
| `reporter_id` | Integer, FK → users.id | |
| `created_at` | DateTime, default now | Used to compute `days_open` for impact score |
| `updated_at` | DateTime, auto-update | |

**Computed (not stored):** `upvote_count` (COUNT from upvotes table), `impact_score` (computed in Python at read time).

**Relationships:** One issue → many upvotes. One issue → many remarks.

---

### Upvote

A join table between users and issues. One row = one student confirmed this issue affects them.

| Field | Type | Notes |
|---|---|---|
| `id` | Integer, PK, autoincrement | |
| `user_id` | Integer, FK → users.id | The student who upvoted |
| `issue_id` | Integer, FK → issues.id | The issue being upvoted |
| `created_at` | DateTime, default now | |

**Constraint:** UNIQUE(user_id, issue_id) — enforced at the database level to prevent double-upvotes regardless of application logic.

**Relationships:** Many-to-one to User. Many-to-one to Issue.

---

### IssueRemark

Stores admin remarks added when updating issue status. One issue can have multiple remarks over time (e.g., "Assigned to electrician", then "Fixed").

| Field | Type | Notes |
|---|---|---|
| `id` | Integer, PK, autoincrement | |
| `issue_id` | Integer, FK → issues.id | |
| `admin_id` | Integer, FK → users.id | The admin who wrote the remark |
| `remark` | String(500), not null | |
| `status_at_time` | String(20), not null | What status was set with this remark |
| `created_at` | DateTime, default now | Displayed on detail page |

**Relationships:** Many-to-one to Issue. Many-to-one to User (admin).

---

## 7. Entity Relationships

```
User 1 ──────────────────── * Issue
(reporter_id)

User 1 ──────────────────── * Upvote
(user_id)

User 1 ──────────────────── * IssueRemark
(admin_id — only admin users write remarks)

Issue 1 ─────────────────── * Upvote
(issue_id)

Issue 1 ─────────────────── * IssueRemark
(issue_id)


Full picture:

┌────────────┐           ┌────────────┐           ┌────────────┐
│   User     │ 1       * │   Issue    │ 1       * │ IssueRemark│
│────────────│───────────│────────────│───────────│────────────│
│ id (PK)    │           │ id (PK)    │           │ id (PK)    │
│ name       │           │ title      │           │ issue_id   │
│ email      │           │ description│           │ admin_id   │
│ password_  │           │ category   │           │ remark     │
│   hash     │           │ location   │           │ status_at_ │
│ is_admin   │           │ severity   │           │   time     │
│ created_at │           │ status     │           │ created_at │
└────────────┘           │ image_path │           └────────────┘
      │                  │ reporter_id│
      │                  │ created_at │
      │                  │ updated_at │
      │                  └────────────┘
      │                        │
      │                        │ 1
      │                        │
      │                   * ┌──────────┐
      └───────────────────── │  Upvote  │
         (user_id)           │──────────│
                             │ id (PK)  │
                             │ user_id  │
                             │ issue_id │
                             │ created_at│
                             └──────────┘
                        UNIQUE(user_id, issue_id)
```

---

## 8. Security Considerations

### Password Hashing

Passwords are never stored in plaintext. `werkzeug.security.generate_password_hash` uses PBKDF2-HMAC-SHA256 with a random salt. `check_password_hash` is used at login. This is the standard approach for Flask apps and is already a dependency.

### Authorization

- Every write route (report, upvote, admin update) checks authentication via `@login_required`.
- Every admin route additionally checks `current_user.is_admin` via a `@admin_required` decorator. A student who manually navigates to `/admin/` receives a 403 response.
- Upvote route additionally checks that `current_user.id != issue.reporter_id` in application logic.

### Input Validation

All form inputs are validated server-side before any database write:
- Field lengths enforced (title ≤ 120 chars, description ≤ 2000 chars, remark ≤ 500 chars).
- Category, severity, and status fields validated against explicit allowlists — not passed to the DB as-is.
- Keyword search input is passed as a parameterized query value, not interpolated into SQL.

### SQL Injection Prevention

SQLAlchemy's ORM is used for all queries. Parameterized queries are used throughout — no raw string interpolation of user input into SQL. This is the main reason for using SQLAlchemy rather than the raw `sqlite3` module.

### File Upload Validation

When an image is uploaded:
- Extension is checked against an allowlist: `{jpg, jpeg, png, webp}`. MIME type sniffing is not relied upon alone.
- File size is checked server-side (reject if > 2 MB) in addition to any client-side limit.
- The file is renamed to a UUID before saving (`uuid4().hex + ext`) — the original filename from the user is never used on disk or in the path. This prevents path traversal and filename-based attacks.
- Files are saved outside the application source directory and served from `/static/uploads/` only.

### Session Security

Flask's session cookie is signed with `SECRET_KEY`. The secret key is set via an environment variable (not hardcoded in source). In development, a long random string is used. Session cookies are `HttpOnly` by default in Flask (not readable by JS).

### What is deliberately not addressed in MVP

HTTPS termination (handled by the host), CSRF protection on forms (Flask-WTF can be added in one step post-MVP if needed), and rate limiting on login (acceptable risk at ≤ 100 users on one campus).

---

## 9. Architecture Decisions and Tradeoffs

### Why server-rendered templates instead of a SPA + REST API

A React/Vue frontend would require: a build pipeline (Node.js, npm/vite), CORS configuration, a separate API layer with JSON serialization for every route, JWT or cookie-based cross-origin auth, and deployment of two separate services. For a student project targeting 25 users, this doubles the complexity without adding user-visible value. Jinja2 templates produce the same functional result and are directly implementable.

### Why SQLite instead of PostgreSQL

PostgreSQL requires a running server process, user/role setup, and connection string management. SQLite is a single file on disk — zero configuration, trivially backed up by copying the file, and more than capable of handling the expected load (≤ 100 users, ≤ 1,000 rows at MVP scale). The PRD explicitly notes this as an acceptable risk and specifies migration to PostgreSQL only if concurrency becomes a problem.

### Why Flask instead of FastAPI

FastAPI is well-suited to async workloads and auto-generated API docs. CampusFix is a form-driven, server-rendered application — the async model adds no benefit here, and FastAPI does not provide a templating layer as naturally as Flask + Jinja2. Flask is the PRD-specified choice and the right one for this shape of application.

### Why no frontend JavaScript framework

The only two interactions that benefit from JS are: (1) the upvote toggle (to avoid a full page reload and flicker) and (2) optionally, the live filter form. Both can be handled with fewer than 30 lines of vanilla `fetch` + DOM manipulation. Introducing a framework for this would be engineering overhead with no functional benefit at MVP scale.

### Why local file storage instead of S3/Cloudinary

External object storage requires API credentials, account setup, and handling upload errors from a third-party service. For MVP, local disk is reliable, zero-cost, and keeps the system self-contained. The tradeoff is that images are not preserved across server redeployments unless the uploads folder is explicitly included — acceptable for a student project where the server is not ephemeral.

---

## Final Check — MVP Feature Coverage

Every feature from the PRD MVP Feature Lock (F1–F14) has a clear architectural path in this document:

| PRD Feature | Architectural path |
|---|---|
| F1 — Student registration and login | `users` table + Flask-Login + Werkzeug password hash + `/register` and `/login` routes |
| F2 — Admin login | Same `users` table, `is_admin = True`, same login route, `@admin_required` decorator |
| F3 — Issue reporting | `issues` table + `POST /report` route + file upload to `/static/uploads/` |
| F4 — Issue listing page | `GET /` route + SQLAlchemy query + Jinja2 template |
| F5 — Keyword search | Query param `?q=` + SQLAlchemy `.filter(Issue.title.ilike(...) \| Issue.description.ilike(...))` |
| F6 — Filter by category / location / status / severity | Query params + additional `.filter()` clauses on same listing query |
| F7 — Upvoting | `upvotes` table + `POST /upvote/<id>` + JS fetch call + UNIQUE constraint |
| F8 — Issue detail page | `GET /issues/<id>` route + joined query for remarks and upvote count |
| F9 — Impact score | Python function `compute_impact_score(issue)` called at read time; no stored column |
| F10 — Default sort by impact score | Python-side sort of result list before passing to template (or ORDER BY computed in SQL) |
| F11 — Status tracking | `status` column on `issues` table; visible on all templates |
| F12 — Student profile page | `GET /profile` route + query for `issues WHERE reporter_id = current_user.id` + upvotes join |
| F13 — Admin dashboard | `GET /admin/` route (`@admin_required`) + same listing query with admin-only filter controls |
| F14 — Admin status update + remark | `POST /admin/issues/<id>/update` + UPDATE on `issues` + INSERT into `issue_remarks` |

No features have been added beyond the PRD. No MVP features are unaccounted for.
