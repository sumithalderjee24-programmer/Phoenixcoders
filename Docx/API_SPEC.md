# CampusFix — API Specification

**Version:** 1.0  
**Status:** MVP  
**Source of truth:** PRD.md v1.0, ARCHITECTURE.md v1.0  
**Last Updated:** 2026-09-24

---

## 1. API Overview

CampusFix is a server-rendered Flask application. There is no separate REST API layer — routes return either full HTML pages (Jinja2 templates) or small JSON responses for the one in-page interaction that benefits from it (upvote toggle). All other interactions are standard HTML form `POST` requests followed by a redirect (the POST-Redirect-GET pattern).

This document specifies every route the application exposes: what it accepts, what it returns, what validations it performs, and who is allowed to call it.

**Base URL:** `http://localhost:5000` in development. In production, the host and port are determined by the deployment environment (e.g. `https://campusfix.pythonanywhere.com`). No path prefix (no `/api/v1/`).

**Two response types:**

| Interaction type | Response type | Used for |
|---|---|---|
| Page navigation, form submission | HTML (Jinja2 template or `302 redirect`) | All pages, all forms |
| Upvote toggle | JSON | `POST /issues/<id>/upvote` only |

**Why no pure REST API for everything:** The PRD specifies Jinja2 templates and minimal JavaScript. Building a JSON API for every route would require a separate frontend layer (React/Vue) or manual JS fetch calls for every form, which is out of scope. The upvote toggle is the only case where a full page reload would produce a noticeable flicker, so it uses a small JSON endpoint.

---

## 2. Authentication Strategy

### Mechanism: Flask-Login with server-side sessions

CampusFix uses **Flask-Login** with server-side sessions backed by a signed cookie. This is the standard approach for server-rendered Flask applications and requires no external service.

**How login works:**
1. User submits `POST /auth/login` with email and password.
2. Flask looks up the user by email, calls `check_password_hash(stored_hash, submitted_password)`.
3. On success, `login_user(user)` is called — Flask-Login sets an encrypted session cookie on the response.
4. On all subsequent requests, Flask-Login reads the cookie, verifies its signature, and populates `current_user` with the logged-in user object.
5. `logout_user()` clears the session.

**Passwords:** Stored as a Werkzeug PBKDF2-HMAC-SHA256 hash with a random salt. The plaintext password is never stored or logged.

**Session cookie:** Signed with `app.secret_key` (set via environment variable `SECRET_KEY`). `HttpOnly` by default — not readable by JavaScript.

### Role handling

There is one boolean column `is_admin` on the `users` table (default `False`). Roles are not a separate table.

- **Student:** `is_admin = False`. Authenticated by any valid session.
- **Admin:** `is_admin = True`. Authenticated by the same session mechanism; the role check happens at the route level.

**Two decorators:**

```python
# Applied to routes requiring any logged-in user
@login_required          # from flask_login

# Applied to routes requiring admin
@admin_required          # custom decorator — checks current_user.is_admin, aborts 403 if false
```

**Admin accounts** are not self-registerable. They are seeded via a Flask CLI command:

```bash
flask seed-admin --email admin@college.edu --password <password>
```

### Why this approach is appropriate

- Zero external dependencies beyond Flask-Login (already a standard Flask extension).
- No token management, no JWT expiry handling, no refresh tokens — the session cookie handles everything.
- Appropriate for a single-campus, ≤ 100 user application.
- Students and admins use the same login page; the role is determined after authentication, not before.

---

## 3. Endpoint Table

| Method | Route | Auth | Role | Response type | Description |
|---|---|---|---|---|---|
| GET | `/` | No | — | HTML | Issue listing with search and filter |
| GET | `/issues/<int:id>` | No | — | HTML | Issue detail page |
| GET | `/auth/register` | No | — | HTML | Registration form |
| POST | `/auth/register` | No | — | Redirect / HTML | Create student account |
| GET | `/auth/login` | No | — | HTML | Login form |
| POST | `/auth/login` | No | — | Redirect / HTML | Authenticate and start session |
| POST | `/auth/logout` | Yes | Student/Admin | Redirect | End session |
| GET | `/issues/new` | Yes | Student | HTML | New issue form |
| POST | `/issues/new` | Yes | Student | Redirect / HTML | Submit new issue |
| POST | `/issues/<int:id>/upvote` | Yes | Student | JSON | Toggle upvote on an issue |
| GET | `/profile` | Yes | Student | HTML | Student's reported and upvoted issues |
| GET | `/admin/` | Yes | Admin | HTML | Admin dashboard (all issues, sorted by impact) |
| POST | `/admin/issues/<int:id>/update` | Yes | Admin | Redirect | Update issue status and add optional remark |

**Total: 13 routes, 7 GET, 6 POST.**

---

## 4. Endpoint Details

---

### GET /

**Purpose:** Main public issue listing page. Shows all issues sorted by impact score (descending). Supports keyword search and filtering by category, location, status, and severity. Covers PRD features F4, F5, F6, F9, F10, F11.

**Authentication:** None required. Logged-in users additionally see their upvoted issue IDs highlighted.

**Request body:** None.

**Query parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `q` | string | No | Keyword search — matches against `title` and `description` (case-insensitive) |
| `category` | string | No | Filter by category. Must be one of the allowed category values. |
| `location` | string | No | Filter by location substring (case-insensitive) |
| `status` | string | No | Filter by status: `Open`, `In Progress`, or `Resolved` |
| `severity` | string | No | Filter by severity: `Low`, `Medium`, or `High` |

**Example request:**
```
GET /?q=fan&category=Electrical&status=Open
```

**Success response:** `200 OK` — renders `issues/list.html` with:
- List of issue objects (title, category, location, severity, status, upvote_count, impact_score, created_at)
- Current filter values (to repopulate the filter form)
- If logged in: set of `issue_id` values the current user has upvoted (for rendering "already upvoted" state)

**Possible errors:**
- Invalid `category`, `status`, or `severity` values are silently ignored (treated as no filter) — this avoids showing an error page for a bad URL parameter.

---

### GET /issues/<int:id>

**Purpose:** Full detail page for a single issue. Shows all fields, upvote count, impact score, image (if any), and all admin remarks in chronological order. Covers PRD features F8, F9, F11, F14 (remark display).

**Authentication:** None required.

**Request body:** None.

**Query parameters:** None.

**Example request:**
```
GET /issues/7
```

**Success response:** `200 OK` — renders `issues/detail.html` with:
- Full issue fields: id, title, description, category, location, severity, status, image_path, reporter name, created_at
- `upvote_count` (integer)
- `impact_score` (integer, computed)
- `remarks` (list of: remark text, status_at_time, admin display name, created_at — ordered by created_at ASC)
- If logged in: `user_has_upvoted` (boolean), `user_is_reporter` (boolean, to disable own-upvote button)

**Possible errors:**
- `404 Not Found` — no issue with that ID exists → renders `errors/404.html`

---

### GET /auth/register

**Purpose:** Render the student registration form. Covers PRD feature F1.

**Authentication:** None. If already logged in, redirect to `/`.

**Request body:** None.

**Success response:** `200 OK` — renders `auth/register.html` with an empty form.

---

### POST /auth/register

**Purpose:** Create a new student account. Covers PRD feature F1.

**Authentication:** None.

**Request body** (`application/x-www-form-urlencoded`):

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | string | Yes | 2–100 characters |
| `email` | string | Yes | Valid email format; must be unique in `users` table |
| `password` | string | Yes | 8–128 characters |

**Example request:**
```
POST /auth/register
Content-Type: application/x-www-form-urlencoded

name=Arjun+Mehta&email=arjun%40college.edu&password=securepass123
```

**Success response:** `302 redirect` → `GET /auth/login` with a flash message: `"Account created. Please log in."`

**Possible errors** (re-renders `auth/register.html` with inline errors):

| Condition | Error shown |
|---|---|
| Name missing or too short | "Name must be at least 2 characters." |
| Email missing or invalid format | "Enter a valid email address." |
| Email already registered | "An account with this email already exists." |
| Password missing or too short | "Password must be at least 8 characters." |
| Password too long | "Password must be under 128 characters." |

---

### GET /auth/login

**Purpose:** Render the login form. Covers PRD features F1, F2.

**Authentication:** None. If already logged in, redirect to `/`.

**Request body:** None.

**Success response:** `200 OK` — renders `auth/login.html`.

---

### POST /auth/login

**Purpose:** Authenticate a student or admin and start a session. Covers PRD features F1, F2.

**Authentication:** None.

**Request body** (`application/x-www-form-urlencoded`):

| Field | Type | Required |
|---|---|---|
| `email` | string | Yes |
| `password` | string | Yes |

**Example request:**
```
POST /auth/login
Content-Type: application/x-www-form-urlencoded

email=arjun%40college.edu&password=securepass123
```

**Success responses:**
- Student login: `302 redirect` → `GET /` (or `next` parameter if set by `@login_required`)
- Admin login: `302 redirect` → `GET /admin/`

**Possible errors** (re-renders `auth/login.html` with error):

| Condition | Error shown |
|---|---|
| Email not found | "Invalid email or password." (intentionally vague — do not reveal whether the email exists) |
| Password incorrect | "Invalid email or password." |
| Either field empty | "Email and password are required." |

---

### POST /auth/logout

**Purpose:** End the current session. Covers PRD features F1, F2.

**Authentication:** Required (any logged-in user). A logged-out user POSTing here is redirected to `/` with no error.

**Request body:** None (CSRF token only when CSRF protection is added post-MVP).

**Success response:** `302 redirect` → `GET /auth/login` with flash message: `"You have been logged out."`

---

### GET /issues/new

**Purpose:** Render the new issue form. Covers PRD feature F3.

**Authentication:** Required (`@login_required`). Unauthenticated users are redirected to `/auth/login?next=/issues/new`.

**Request body:** None.

**Success response:** `200 OK` — renders `issues/new.html` with:
- Empty form fields
- Dropdown options for `category` and `severity`

---

### POST /issues/new

**Purpose:** Submit a new campus issue. Covers PRD feature F3. On success, redirects to the new issue's detail page (POST-Redirect-GET).

**Authentication:** Required (`@login_required`).

**Request body** (`multipart/form-data` to support optional image):

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | string | Yes | 5–120 characters |
| `description` | string | Yes | 20–2000 characters |
| `category` | string | Yes | Must be one of: `Electrical`, `Plumbing`, `Furniture`, `Wi-Fi`, `Washroom`, `Lab Equipment`, `Hostel`, `Other` |
| `location` | string | Yes | 3–100 characters |
| `severity` | string | Yes | Must be one of: `Low`, `Medium`, `High` |
| `image` | file | No | Extension: `jpg`, `jpeg`, `png`, or `webp`. Max size: 2 MB. |

**Example request:**
```
POST /issues/new
Content-Type: multipart/form-data

title=Broken ceiling fan in Room 204
description=The ceiling fan in Room 204 has not worked for three weeks. Classes are affected during the afternoon when the room becomes very hot.
category=Electrical
location=Room 204, Main Block
severity=High
image=<binary file data>
```

**Success response:** `302 redirect` → `GET /issues/<new_issue_id>`

**Possible errors** (re-renders `issues/new.html` with inline field errors):

| Condition | Error |
|---|---|
| Title missing or too short | "Title must be at least 5 characters." |
| Title too long | "Title must be under 120 characters." |
| Description missing or too short | "Description must be at least 20 characters." |
| Description too long | "Description must be under 2000 characters." |
| Invalid category | "Select a valid category." |
| Location missing or too short | "Location must be at least 3 characters." |
| Invalid severity | "Select a valid severity level." |
| Image wrong extension | "Only jpg, jpeg, png, and webp files are allowed." |
| Image too large | "Image must be under 2 MB." |

**Image handling on success:**
1. Generate filename: `uuid4().hex + extension` (e.g. `a3f8c12d...4b.jpg`)
2. Save to `app/static/uploads/<filename>`
3. Store `uploads/<filename>` in `issues.image_path`
4. Original filename from the user is never used on disk.

---

### POST /issues/<int:id>/upvote

**Purpose:** Toggle the current user's upvote on an issue. If no upvote exists, creates one. If one exists, removes it. Returns JSON so the page can update the count without a full reload. Covers PRD feature F7.

**Authentication:** Required (`@login_required`). Returns `401 JSON` if not logged in (the JS caller redirects the user to `/auth/login`).

**Request body:** None (the issue ID is in the URL).

**Example request:**
```
POST /issues/7/upvote
```

**Success response:** `200 OK` — JSON:

```json
{
  "action": "added",
  "upvote_count": 13
}
```

or, if toggled off:

```json
{
  "action": "removed",
  "upvote_count": 12
}
```

| Field | Type | Description |
|---|---|---|
| `action` | string | `"added"` or `"removed"` |
| `upvote_count` | integer | New total upvote count for the issue after this action |

**Possible errors** (JSON responses):

| Condition | HTTP status | JSON body |
|---|---|---|
| Not logged in | `401` | `{"error": {"code": "UNAUTHORIZED", "message": "Login required to upvote."}}` |
| Issue does not exist | `404` | `{"error": {"code": "NOT_FOUND", "message": "Issue not found."}}` |
| User is the reporter | `403` | `{"error": {"code": "FORBIDDEN", "message": "You cannot upvote your own issue."}}` |

**Database guarantee:** A `UNIQUE(user_id, issue_id)` constraint on the `upvotes` table prevents double-upvotes even if the application logic has a bug. The database will raise an `IntegrityError` on a duplicate insert, which the route handles gracefully.

---

### GET /profile

**Purpose:** Show the current student's reported issues and upvoted issues, each with current status. Covers PRD feature F12.

**Authentication:** Required (`@login_required`).

**Request body:** None.

**Query parameters:** None.

**Success response:** `200 OK` — renders `profile/index.html` with:
- `reported_issues`: list of issues where `reporter_id = current_user.id`, ordered by `created_at DESC`
  - Each: id, title, category, location, severity, status, upvote_count, impact_score, created_at
- `upvoted_issues`: list of issues the user has upvoted (joined via `upvotes` table), ordered by upvote `created_at DESC`
  - Each: id, title, category, location, severity, status, upvote_count, impact_score

---

### GET /admin/

**Purpose:** Admin dashboard. Shows all issues sorted by impact score (descending) with filter controls. Covers PRD features F13, F9, F10, F6 (admin-side filtering).

**Authentication:** Required (`@admin_required` — must be logged in and `is_admin = True`).

**Request body:** None.

**Query parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `category` | string | No | Filter by category |
| `status` | string | No | Filter by status: `Open`, `In Progress`, `Resolved` |
| `severity` | string | No | Filter by severity: `Low`, `Medium`, `High` |

**Note:** The admin listing does not support keyword search (not required by the PRD for the admin view). The admin filters by structured fields to manage their area of responsibility.

**Example request:**
```
GET /admin/?status=Open&severity=High
```

**Success response:** `200 OK` — renders `admin/dashboard.html` with:
- `summary`: `{ total, open, in_progress, resolved }` counts
- `issues`: list of all matching issues ordered by `impact_score DESC`, each with:
  - id, title, category, location, severity, status, upvote_count, impact_score, reporter name, created_at

**Possible errors:**
- `403 Forbidden` — user is logged in but `is_admin = False` → renders `errors/403.html`
- `302 redirect` → `/auth/login` — user is not logged in

---

### POST /admin/issues/<int:id>/update

**Purpose:** Update an issue's status and optionally add an admin remark. Covers PRD feature F14.

**Authentication:** Required (`@admin_required`).

**Request body** (`application/x-www-form-urlencoded`):

| Field | Type | Required | Constraints |
|---|---|---|---|
| `status` | string | Yes | Must be one of: `Open`, `In Progress`, `Resolved` |
| `remark` | string | No | Max 500 characters. If empty or whitespace-only, no remark row is inserted. |

**Example request:**
```
POST /admin/issues/7/update
Content-Type: application/x-www-form-urlencoded

status=In+Progress&remark=Electrician+scheduled+for+Thursday+morning.
```

**Success response:** `302 redirect` → `GET /issues/7` with flash message: `"Issue status updated."`

**What happens on success:**
1. `UPDATE issues SET status = <new_status>, updated_at = now() WHERE id = <id>`
2. If remark is non-empty after stripping whitespace: `INSERT INTO issue_remarks (issue_id, admin_id, remark, status_at_time, created_at) VALUES (...)`
3. Redirect to the public issue detail page (not the admin dashboard) so the admin can immediately see the student-facing view.

**Possible errors:**

| Condition | Behaviour |
|---|---|
| Issue does not exist | `404` → renders `errors/404.html` |
| Invalid status value | Re-renders issue detail with error: "Select a valid status." |
| Remark too long | Re-renders issue detail with error: "Remark must be under 500 characters." |
| Not an admin | `403` → renders `errors/403.html` |

---

## 5. Standard Error Response

### HTML routes

For HTML routes, errors are communicated via:
- **Flash messages** (for form validation failures — rendered inline on the same page)
- **Error template pages** for 401, 403, 404, 500

Flask's error handlers:
```python
@app.errorhandler(404)
def not_found(e):
    return render_template("errors/404.html"), 404

@app.errorhandler(403)
def forbidden(e):
    return render_template("errors/403.html"), 403

@app.errorhandler(500)
def server_error(e):
    return render_template("errors/500.html"), 500
```

### JSON routes (upvote endpoint only)

The upvote endpoint (`POST /issues/<id>/upvote`) returns a consistent JSON error structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable explanation."
  }
}
```

**Error codes and HTTP statuses used:**

| HTTP status | Code | When it occurs |
|---|---|---|
| `400 Bad Request` | `VALIDATION_ERROR` | Input fails a validation rule |
| `401 Unauthorized` | `UNAUTHORIZED` | Request requires login; user is not logged in |
| `403 Forbidden` | `FORBIDDEN` | User is logged in but not allowed (e.g. upvoting own issue, non-admin on admin route) |
| `404 Not Found` | `NOT_FOUND` | Resource does not exist (issue ID not in database) |
| `409 Conflict` | `CONFLICT` | Reserved for future use; not used in MVP (upvote conflicts are resolved by toggle logic, not rejected) |
| `500 Internal Server Error` | `SERVER_ERROR` | Unhandled exception; logged server-side |

**Example 401 response:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Login required to upvote."
  }
}
```

**Example 403 response:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You cannot upvote your own issue."
  }
}
```

**Example 404 response:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Issue not found."
  }
}
```

---

## 6. Validation Rules

### User registration

| Field | Rule |
|---|---|
| `name` | Required. String. Min 2 characters, max 100 characters. Strip leading/trailing whitespace before validation. |
| `email` | Required. Must match a basic email pattern (`something@something.something`). Max 200 characters. Must be unique in the `users` table (case-insensitive check). |
| `password` | Required. Min 8 characters, max 128 characters. No complexity rules in MVP (keep it simple). |

### User login

| Field | Rule |
|---|---|
| `email` | Required. |
| `password` | Required. |
| Combined | If email not found OR password does not match: show generic "Invalid email or password." Do not distinguish the two cases (prevents email enumeration). |

### Issue creation

| Field | Rule |
|---|---|
| `title` | Required. String. Min 5 characters, max 120 characters after stripping whitespace. |
| `description` | Required. String. Min 20 characters, max 2000 characters after stripping whitespace. |
| `category` | Required. Must be exactly one of: `Electrical`, `Plumbing`, `Furniture`, `Wi-Fi`, `Washroom`, `Lab Equipment`, `Hostel`, `Other`. Validated against this allowlist — not trusted as free text. |
| `location` | Required. String. Min 3 characters, max 100 characters after stripping whitespace. Free text (not a dropdown in MVP). |
| `severity` | Required. Must be exactly one of: `Low`, `Medium`, `High`. |
| `image` | Optional. If present: file extension must be `jpg`, `jpeg`, `png`, or `webp` (case-insensitive). File size must be ≤ 2,097,152 bytes (2 MB). MIME type is not relied upon alone — extension is the primary check. If extension check passes, save with a UUID filename. |

### Upvote

| Rule | Detail |
|---|---|
| User must be logged in | Enforced by `@login_required` before any logic runs. |
| Issue must exist | Checked with a database query; 404 if not found. |
| User must not be the reporter | `current_user.id != issue.reporter_id`; 403 if equal. |
| One upvote per user per issue | Enforced by `UNIQUE(user_id, issue_id)` constraint in the `upvotes` table AND toggle logic in the route. |
| Toggle behaviour | If upvote exists: delete it (`action = "removed"`). If not: insert it (`action = "added"`). |

### Admin status update

| Field | Rule |
|---|---|
| `status` | Required. Must be exactly one of: `Open`, `In Progress`, `Resolved`. |
| `remark` | Optional. If provided: max 500 characters after stripping whitespace. If empty or whitespace-only after stripping: no remark row is written. |

### Impact score computation

The impact score is computed in Python at read time (not stored in the database).

```python
SEVERITY_WEIGHT = {"Low": 1, "Medium": 2, "High": 3}

def compute_impact_score(issue, upvote_count):
    days_open = (datetime.utcnow() - issue.created_at).days
    age_bonus = min(days_open, 30)
    return (upvote_count * 3) + (SEVERITY_WEIGHT[issue.severity] * 5) + age_bonus
```

| Component | Formula |
|---|---|
| Upvote contribution | `upvote_count × 3` |
| Severity contribution | `severity_weight × 5` (Low=1, Medium=2, High=3) |
| Age bonus | `min(days_since_created, 30)` |
| **Total** | **Sum of the three** |

This is called once per issue when building the listing or detail page. Resolved issues are still scored (so the admin can see how impactful a resolved issue was) but the sort on the admin dashboard can optionally exclude `Resolved` issues using the status filter.

---

## 7. Authorization Rules

### Who can do what

| Action | Logged-out | Student (is_admin=False) | Admin (is_admin=True) |
|---|---|---|---|
| Browse issue listing (`GET /`) | ✅ Yes | ✅ Yes | ✅ Yes |
| View issue detail (`GET /issues/<id>`) | ✅ Yes | ✅ Yes | ✅ Yes |
| Register (`POST /auth/register`) | ✅ Yes | — (already registered) | — |
| Log in (`POST /auth/login`) | ✅ Yes | ✅ Yes | ✅ Yes |
| Log out (`POST /auth/logout`) | ❌ No | ✅ Yes | ✅ Yes |
| Report a new issue (`POST /issues/new`) | ❌ No → redirect to login | ✅ Yes | ✅ Yes* |
| Edit their own issue | ❌ No | ❌ No (not in MVP) | ❌ No (not in MVP) |
| Delete an issue | ❌ No | ❌ No (not in MVP) | ❌ No (not in MVP) |
| Upvote an issue (`POST /issues/<id>/upvote`) | ❌ No → 401 JSON | ✅ Yes (not own issue) | ✅ Yes* |
| Upvote own issue | ❌ No | ❌ No → 403 JSON | ❌ No → 403 JSON |
| View profile (`GET /profile`) | ❌ No → redirect to login | ✅ Yes (own profile only) | ✅ Yes* |
| View admin dashboard (`GET /admin/`) | ❌ No → redirect to login | ❌ No → 403 | ✅ Yes |
| Update issue status (`POST /admin/issues/<id>/update`) | ❌ No → redirect to login | ❌ No → 403 | ✅ Yes |

> *Admins can also create issues and upvote (they are valid users), but this is an edge case — in practice, admins use the system to manage issues, not file them. No special restriction is applied.

### Clarification on issue editing and deletion

Issue editing and deletion are **not in the MVP** (see PRD Section 8 — Out of Scope). Once submitted, an issue is immutable from the student side. Only the status and remarks are mutable, and only by admins. This simplifies the authorization model significantly.

If a student submits an issue with an error, they can add context by having an admin update the remark, or the admin can manually correct it. A formal edit flow can be added post-MVP.

---

## Final Check — PRD MVP Feature Lock vs. API Coverage

| PRD # | Feature | Route(s) covering it |
|---|---|---|
| F1 | Student registration and login | `GET /auth/register`, `POST /auth/register`, `GET /auth/login`, `POST /auth/login`, `POST /auth/logout` |
| F2 | Admin login | `POST /auth/login` (same route; `is_admin` flag distinguishes), `POST /auth/logout` |
| F3 | Issue reporting | `GET /issues/new`, `POST /issues/new` |
| F4 | Issue listing page | `GET /` |
| F5 | Keyword search | `GET /?q=<keyword>` |
| F6 | Filter by category / location / status / severity | `GET /?category=&location=&status=&severity=` and `GET /admin/?category=&status=&severity=` |
| F7 | Upvoting | `POST /issues/<id>/upvote` |
| F8 | Issue detail page | `GET /issues/<id>` |
| F9 | Impact score | Computed in Python when building responses for `GET /`, `GET /issues/<id>`, `GET /profile`, `GET /admin/` |
| F10 | Default sort by impact score | Applied at query time in `GET /` and `GET /admin/` |
| F11 | Status tracking | `status` field visible on `GET /`, `GET /issues/<id>`, `GET /profile` |
| F12 | Student profile page | `GET /profile` |
| F13 | Admin dashboard | `GET /admin/` |
| F14 | Admin status update + remark | `POST /admin/issues/<id>/update` |

**Result: All 14 MVP features have at least one route covering them. No features are missing. No routes have been added beyond what the PRD requires.**

### Routes that do NOT exist (deliberate omissions)

These are confirmed out-of-scope and must not be added in MVP:

- `PUT /issues/<id>` — issue editing by student (post-MVP)
- `DELETE /issues/<id>` — issue deletion (post-MVP)
- `GET /admin/users` — user management (post-MVP)
- `GET /issues/<id>/comments` — comment threads (post-MVP)
- `GET /admin/export` — CSV export (post-MVP)
- Any notification endpoint — email/push notifications (post-MVP)
