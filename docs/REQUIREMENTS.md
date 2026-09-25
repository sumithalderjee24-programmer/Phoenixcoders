# CampusFix — Requirements

**Version:** 1.0  
**Status:** MVP  
**Source of truth:** PRD.md v1.0, ARCHITECTURE.md v1.0, API_SPEC.md v1.0, ROADMAP.md v1.0  
**Last Updated:** 2026-09-24

---

## 1. Functional Requirements

### Authentication

**FR-01:** The system shall allow a new visitor to register a student account by submitting a name (2–100 characters), a valid email address (max 200 characters, unique in the system), and a password (8–128 characters). Registration shall fail with an inline error message if any field is missing, if the email format is invalid, or if the email already exists in the database.

**FR-02:** The system shall reject registration for a name shorter than 2 characters, an email that does not match the pattern `something@something.something`, a password shorter than 8 characters, and a password longer than 128 characters. Each violation shall produce a specific inline error without redirecting away from the form.

**FR-03:** The system shall allow a registered user (student or admin) to log in by submitting their email and password via `POST /auth/login`. On success, a Flask-Login session cookie shall be set and the user shall be redirected to the issue listing page (`/`). On failure (email not found or password mismatch), the system shall display the generic message "Invalid email or password." without indicating which field was wrong.

**FR-04:** The system shall allow any authenticated user (student or admin) to log out via `POST /auth/logout`. After logout, the session shall be cleared and the user shall be redirected to the login page. A logged-out user who attempts to access an auth-required route shall be redirected to `/auth/login`.

**FR-05:** The system shall enforce two roles using the `is_admin` boolean column on the `users` table. Users with `is_admin = False` are students; users with `is_admin = True` are admins. Role assignment shall not be available through any public registration or profile form.

**FR-06:** Admin accounts shall only be created via a Flask CLI command (`flask seed-admin --email <email> --password <password>`). No self-registration path shall exist for admin accounts.

**FR-07:** Any route decorated with `@login_required` shall return a redirect to `/auth/login` for unauthenticated requests. Any route decorated with `@admin_required` shall return an HTTP 403 response for requests from authenticated non-admin users.

**FR-08:** A visitor who is already logged in and navigates to `GET /auth/register` or `GET /auth/login` shall be redirected to `/`.

---

### Issue Management

**FR-09:** The system shall allow an authenticated student to create a new issue by submitting the following fields via `POST /issues/new`:
- `title` — required, 5–120 characters after whitespace stripping
- `description` — required, 20–2000 characters after whitespace stripping
- `category` — required, must be exactly one of: `Electrical`, `Plumbing`, `Furniture`, `Wi-Fi`, `Washroom`, `Lab Equipment`, `Hostel`, `Other`
- `location` — required, 3–100 characters after whitespace stripping
- `severity` — required, must be exactly one of: `Low`, `Medium`, `High`
- `image` — optional file attachment

**FR-10:** On a successful issue submission, the system shall store the issue in the `issues` table with `status = "Open"` and `reporter_id` set to `current_user.id`, then redirect the student to the new issue's detail page (`/issues/<id>`).

**FR-11:** If issue creation fails validation, the system shall re-render the form with inline error messages for each failing field. Previously entered valid field values shall be repopulated in the form.

**FR-12:** The issue `category` field shall be validated against the eight-value allowlist on the server side before any database write. A value not on the allowlist shall cause a validation failure; it shall not be passed to the database.

**FR-13:** The issue `severity` field shall be validated against the allowlist `{Low, Medium, High}` on the server side. A value not on the allowlist shall cause a validation failure.

**FR-14:** The system shall allow an optional image to be uploaded with a new issue. The uploaded file shall only be accepted if: (a) the file extension is `jpg`, `jpeg`, `png`, or `webp` (case-insensitive), and (b) the file size is ≤ 2,097,152 bytes (2 MB). Files failing either check shall be rejected with an inline error and the rest of the form shall not be submitted.

**FR-15:** On a valid image upload, the system shall rename the file to a UUID-based filename (`uuid4().hex + ext`) before saving it to `/static/uploads/`. The original filename supplied by the user shall not be used on disk or in the stored path.

**FR-16:** The system shall display a public issue listing page at `GET /` showing all issues in the database, accessible without login. Each issue card on the listing shall display: title, category, location, severity, status, upvote count, and impact score.

**FR-17:** The issue listing page shall support keyword search via the `?q=` query parameter. The search shall filter issues where the keyword appears (case-insensitively) in the `title` or `description` fields, using a parameterized SQLAlchemy query.

**FR-18:** The issue listing page shall support filtering by the following query parameters, applied independently and in combination: `?category=`, `?location=` (substring match, case-insensitive), `?status=`, `?severity=`. An invalid or unrecognised value for `category`, `status`, or `severity` shall be silently ignored rather than returning an error page.

**FR-19:** The system shall display a public issue detail page at `GET /issues/<id>` showing all of the following fields for one issue: title, description, category, location, severity, reporter display name, date submitted, current status, upvote count, impact score, attached image (if any), and all admin remarks in chronological order. A request for a non-existent issue ID shall return an HTTP 404 response.

**FR-20:** The issue detail page shall indicate, for a logged-in user, whether they have already upvoted that issue (`user_has_upvoted`) and whether they are the original reporter (`user_is_reporter`), so the upvote button can be rendered in the appropriate state.

---

### Community Interaction

**FR-21:** The system shall allow an authenticated student to upvote any issue they did not report, via `POST /issues/<id>/upvote`. On success, the response shall be a JSON object containing the updated `upvote_count` and an `action` field of either `"added"` or `"removed"`.

**FR-22:** The upvote action shall toggle: if the current user has not upvoted the issue, a row shall be inserted into the `upvotes` table; if they have already upvoted, that row shall be deleted. Both the application-level toggle logic and a `UNIQUE(user_id, issue_id)` database constraint shall enforce the one-upvote-per-student-per-issue rule.

**FR-23:** If an authenticated student attempts to upvote an issue they reported themselves, the system shall return an HTTP 403 JSON response with `code: "FORBIDDEN"` and the message `"You cannot upvote your own issue."` No database write shall occur.

**FR-24:** If an unauthenticated user attempts to call `POST /issues/<id>/upvote`, the system shall return an HTTP 401 JSON response with `code: "UNAUTHORIZED"`. No redirect shall occur for this endpoint (it is called via JavaScript fetch, not a form POST).

**FR-25:** The upvote count for each issue shall be visible on both the issue listing page (within the issue card) and on the issue detail page. The count shall reflect the total number of rows in the `upvotes` table for that issue.

---

### Issue Tracking

**FR-26:** Every issue shall have a `status` field with one of three values: `Open` (default on creation), `In Progress`, or `Resolved`. The status shall be visible on the issue listing page, the issue detail page, and the student profile page.

**FR-27:** The system shall allow an admin to change an issue's status via `POST /admin/issues/<id>/update` by submitting a `status` value from the allowlist `{Open, In Progress, Resolved}`. A status value not on the allowlist shall be rejected with a validation error and no database write shall occur.

**FR-28:** When an admin updates an issue's status, the new status value shall be written to the `issues` table and the change shall be immediately visible on the public listing and detail pages within the same session.

**FR-29:** The system shall record each admin remark in the `issue_remarks` table with the following fields: `issue_id`, `admin_id`, `remark` (the text), `status_at_time` (the status at the time of the update), and `created_at` (timestamp). All remarks for an issue shall be displayed on the detail page in ascending chronological order.

---

### Prioritization

**FR-30:** The system shall compute an impact score for every issue using the following formula, evaluated in Python at read time:

```
impact_score = (upvote_count × 3) + (severity_weight × 5) + min(days_open, 30)
```

Where `severity_weight` is: `Low = 1`, `Medium = 2`, `High = 3`, and `days_open` is the number of full days since `issues.created_at` (using UTC).

**FR-31:** The impact score shall not be stored as a column in the database. It shall be recomputed each time an issue is fetched for listing or display. The function `compute_impact_score(issue, upvote_count)` shall accept the issue object and the upvote count as arguments and return a single integer.

**FR-32:** The impact score shall be displayed on every issue card on the listing page, on the issue detail page, and on every issue row in the admin dashboard.

**FR-33:** The issue listing page (`GET /`) and the admin dashboard (`GET /admin/`) shall sort issues by impact score in descending order by default (highest impact score first). This sort shall be applied after computing the score in Python for all returned issues.

---

### Administration

**FR-34:** The system shall provide an admin dashboard at `GET /admin/` accessible only to users with `is_admin = True`. A student navigating directly to `/admin/` shall receive an HTTP 403 response.

**FR-35:** The admin dashboard shall list all issues from the database sorted by impact score (descending), displaying for each issue: title, category, location, severity, status, upvote count, impact score, reporter name, and date submitted.

**FR-36:** The admin dashboard shall support filtering by the following query parameters: `?category=`, `?status=`, `?severity=`. Filters shall work independently and in combination and shall use the same validation approach as the public listing (invalid values silently ignored).

**FR-37:** The system shall allow an admin to update the status and add an optional remark for any issue via `POST /admin/issues/<id>/update`. If the remark field is empty or contains only whitespace after stripping, no row shall be inserted into `issue_remarks`. If a non-empty remark is submitted, a row shall be inserted with a server-generated timestamp.

**FR-38:** The admin remark input shall accept a maximum of 500 characters after whitespace stripping. Submissions exceeding this limit shall be rejected with a validation error and no database write shall occur.

**FR-39:** After a successful status update, the admin shall be redirected back to the issue detail page (`GET /issues/<id>`) where the updated status and any new remark shall be immediately visible.

**FR-40:** The system shall provide a student profile page at `GET /profile` accessible only to authenticated users. The profile shall display two sections: (1) issues the current user reported, and (2) issues the current user has upvoted. Each listed issue shall show its title, status, and a link to its detail page. No route of the form `/profile/<user_id>` shall exist; students can only view their own profile.

---

## 2. Non-Functional Requirements

### Performance

**NFR-01:** The issue listing page (`GET /`) with no more than 500 issues in the database shall return a complete HTML response within 2 seconds on a standard shared hosting environment (e.g. PythonAnywhere free tier) under single-user load.

**NFR-02:** The upvote endpoint (`POST /issues/<id>/upvote`) shall return a JSON response within 1 second under single-user load on the same hosting environment.

**NFR-03:** Image files uploaded to `/static/uploads/` shall be served directly by Flask as static files. No image processing or resizing shall be performed server-side during the request cycle in the MVP.

**NFR-04:** The impact score shall be computed in Python at read time without an additional database query per issue (upvote counts shall be fetched alongside issue data in a single query or a minimal join, not in a per-issue loop).

---

### Security

**NFR-05:** Passwords shall never be stored in plaintext. All passwords shall be hashed using `werkzeug.security.generate_password_hash`, which uses PBKDF2-HMAC-SHA256 with a per-user random salt. Password verification shall use `werkzeug.security.check_password_hash`.

**NFR-06:** The Flask session cookie shall be signed using `app.secret_key`. The secret key shall be set via the `SECRET_KEY` environment variable and shall not be hardcoded in any source file committed to version control.

**NFR-07:** Every write route (`POST /issues/new`, `POST /issues/<id>/upvote`, `POST /admin/issues/<id>/update`, `POST /auth/logout`) shall be protected by `@login_required` or `@admin_required`. Unauthenticated requests to these routes shall receive a redirect to `/auth/login` (or a 401 JSON response for the upvote endpoint).

**NFR-08:** The `@admin_required` decorator shall verify `current_user.is_admin == True` before processing any request to an admin route. Authenticated non-admin users shall receive an HTTP 403 response.

**NFR-09:** All database queries shall use SQLAlchemy's ORM or parameterised query interface. No user-supplied input (search keywords, filter values, form fields) shall be interpolated directly into a SQL string.

**NFR-10:** All form inputs shall be validated server-side before any database write, regardless of any client-side validation. Field lengths, category values, severity values, and status values shall be checked against explicit allowlists. Allowlist violations shall produce a validation error, not a database error.

**NFR-11:** Uploaded image files shall be validated server-side on two criteria before saving: (a) the file extension must be in `{jpg, jpeg, png, webp}` (case-insensitive), and (b) the file size must be ≤ 2,097,152 bytes. Files failing either check shall be rejected with an error message and not saved.

**NFR-12:** Uploaded image files shall be saved with a UUID-based filename generated by the server. The original filename from the user's browser shall not be used on disk or in any stored path. This prevents path traversal and filename injection.

**NFR-13:** The login error response shall not distinguish between "email not found" and "incorrect password." Both cases shall produce the identical message `"Invalid email or password."` to prevent email enumeration.

---

### Accessibility

**NFR-14:** Every `<input>`, `<select>`, and `<textarea>` element in every form shall have an associated `<label>` element. The label shall be linked to its input using a matching `for` and `id` attribute pair, or by wrapping the input inside the label.

**NFR-15:** Form error messages shall be rendered as visible inline text near the relevant field, not solely communicated through colour change. Error text shall have sufficient contrast (minimum 4.5:1 against background) to be readable without colour.

**NFR-16:** All pages shall be usable on a viewport of 375 px width (a typical small mobile screen) without horizontal scrolling. Layout shall use relative units (percentages, `em`, `rem`) rather than fixed pixel widths for primary containers.

**NFR-17:** Status badges (Open, In Progress, Resolved) and severity badges (Low, Medium, High) shall be distinguishable by both colour and text label. Colour alone shall not be the only means of conveying status.

**NFR-18:** All primary user flows (register, log in, report an issue, upvote an issue, view profile) shall be completable using only a keyboard (Tab to navigate, Enter/Space to activate controls) without requiring a pointing device.

---

### Reliability

**NFR-19:** If a database write fails due to an unexpected error, the system shall not display a raw Python traceback to the user. The user shall see a generic error page (HTTP 500) with a message indicating that something went wrong. The full exception shall be logged server-side.

**NFR-20:** Custom error pages shall exist for at least HTTP 403, 404, and 500 responses. These pages shall render within the application's visual template rather than showing Flask's default error output.

**NFR-21:** The `UNIQUE(user_id, issue_id)` constraint on the `upvotes` table shall be enforced at the database level. If application-level toggle logic fails and a duplicate insert is attempted, the database constraint shall raise an `IntegrityError`, which the route handler shall catch and handle gracefully (log the error, return an appropriate response) rather than crashing.

---

### Maintainability

**NFR-22:** Route handlers shall not contain inline SQL strings. All database access shall go through SQLAlchemy models defined in a dedicated `models.py` (or equivalent module). Business logic (impact score computation, upvote toggle, file validation) shall be separated into helper functions rather than written inline in route handlers.

**NFR-23:** The impact score formula shall be implemented in a single function (`compute_impact_score`) that is called from all listing and detail views. The formula shall not be duplicated across files.

**NFR-24:** Configuration values (secret key, upload folder path, allowed file extensions, max file size, allowed category values, allowed severity values, allowed status values) shall be defined as constants or config variables in one location and imported where needed.

**NFR-25:** The project shall include a `README.md` with instructions for setting up the development environment (creating a virtualenv, installing dependencies from `requirements.txt`, running database migrations, seeding an admin account, and starting the development server).

---

### Usability

**NFR-26:** After a failed form submission (validation error), the form shall retain all previously entered valid field values. The student shall not need to re-enter data they already submitted correctly.

**NFR-27:** After a student successfully submits an issue, they shall be redirected to that issue's detail page within the same HTTP response cycle (POST-Redirect-GET pattern). They shall not remain on the submission form.

**NFR-28:** The upvote button shall update the upvote count in the page without a full-page reload, using a JavaScript `fetch` call to `POST /issues/<id>/upvote` and DOM manipulation of the count element. The page shall not visibly flicker during the update.

**NFR-29:** The navigation bar shall indicate the user's current authentication state: a logged-in student shall see links to "Report an Issue," "My Profile," and "Log out." A logged-out visitor shall see links to "Log in" and "Register." An admin shall see a visually distinct admin navigation context.

---

## 3. Assumptions

**A-01:** The initial deployment targets a single engineering college campus. Multi-campus support, sub-domain routing, and separate issue spaces per college are out of scope for the MVP.

**A-02:** Users have reliable access to the internet and a modern browser (Chrome, Firefox, Safari, or Edge, current or one major version behind). No offline mode or service worker is provided.

**A-03:** Student identity is not verified against any external college system. Any user may register with any email address. The integrity of the user base is maintained through social accountability (real students using a real campus tool) rather than technical enforcement.

**A-04:** Admin accounts are created manually by the development team using the `flask seed-admin` CLI command before the application is shared with users. There is no self-registration path, approval workflow, or admin management UI for the MVP.

**A-05:** The expected concurrent user load is ≤ 100 users at any one time. SQLite's single-writer model is sufficient at this scale. Migration to PostgreSQL is not required for the MVP.

**A-06:** Uploaded images will not be preserved across server redeployments unless the `/static/uploads/` directory is explicitly backed up. This is an accepted risk for a student project where the server environment is not ephemeral in practice.

**A-07:** HTTPS termination, if required, is handled by the hosting provider (e.g. PythonAnywhere provides HTTPS by default). The Flask application itself does not configure TLS.

**A-08:** The application will be operated by the development team during the pilot. No user support channel, admin management UI, or moderation workflow beyond status updates is needed for the MVP.

**A-09:** The impact score formula weights are fixed for the MVP. No tuning interface, admin configuration screen, or weight adjustment mechanism is required.

**A-10:** Issue content (title, description) is not moderated automatically. The development team or admin is expected to manually remove clearly abusive content if needed; no automated content filtering is in scope.

---

## 4. Constraints

**C-01:** The application shall be implemented in Python 3.x using the Flask web framework. No other backend language or framework (FastAPI, Django, Node.js) shall be used.

**C-02:** The database shall be SQLite, stored as a single `.db` file on disk. No external database server (PostgreSQL, MySQL) is required or expected for the MVP.

**C-03:** The frontend shall use Jinja2 templates rendered server-side by Flask, plain HTML, plain CSS (single stylesheet), and minimal vanilla JavaScript (upvote toggle only). No frontend framework (React, Vue, Angular) or build toolchain (webpack, Vite) shall be used.

**C-04:** The application shall be deployable to a shared hosting environment with Python support (such as PythonAnywhere free tier) without requiring Docker, Kubernetes, cloud provider accounts, or any infrastructure outside of what the hosting provider supplies.

**C-05:** The development team consists of student developers with beginner-to-intermediate Python and web development experience. Architectural choices shall favour simplicity and clarity over advanced patterns.

**C-06:** Development time is limited (approximately 8 weeks across three milestones: Kenshi, Samurai, Shogun, per the roadmap). Features that would materially extend the timeline beyond the roadmap are out of scope.

**C-07:** The MVP scope is fixed by the PRD MVP Feature Lock (F1–F14). No features outside this lock shall be implemented during the MVP lifecycle.

**C-08:** There is no budget for paid third-party services (email delivery, object storage, push notification services, analytics platforms). All functionality shall be achievable with free-tier or self-hosted tooling.

---

## 5. Dependencies

**D-01:** **Flask** — web framework; handles routing, request/response cycle, template rendering, and static file serving.

**D-02:** **Flask-Login** — manages user sessions, the `current_user` proxy, and the `@login_required` decorator. Required for all authentication flows.

**D-03:** **Flask-SQLAlchemy** — ORM layer for all database access. Required for parameterised queries and model definitions. Prevents raw SQL injection risk.

**D-04:** **Werkzeug** — bundled with Flask; provides `generate_password_hash` and `check_password_hash` for PBKDF2-HMAC-SHA256 password hashing.

**D-05:** **SQLite3** — Python standard library module; used as the underlying database engine via SQLAlchemy. No separate installation required.

**D-06:** **Python `uuid` module** — standard library; used to generate UUID4 filenames for uploaded images. No separate installation required.

**D-07:** A **Python 3.x runtime** must be available on the deployment host. PythonAnywhere (free tier) satisfies this constraint and is the documented deployment target.

No paid external services, email providers, object storage, CDN, or third-party APIs are required for or used in the MVP.

---

## 6. Acceptance Criteria

The CampusFix MVP shall be considered complete when all of the following conditions are verified:

**AC-01 — Registration and login:**
A new visitor can register a student account with name, email, and password. The same user can then log in with those credentials and log out. An admin seeded via `flask seed-admin` can log in with the seeded credentials and is redirected to `/admin/`.

**AC-02 — Access control:**
A logged-out visitor can browse `GET /` and `GET /issues/<id>` without login. Navigating to `GET /issues/new`, `GET /profile`, or `GET /admin/` while logged out redirects to `/auth/login`. A logged-in student navigating to `GET /admin/` receives an HTTP 403 response.

**AC-03 — Issue creation:**
A logged-in student can submit the new issue form with all required fields and an optional image. The issue appears on the listing page immediately after submission, with status `Open`. Submitting the form without a required field, with an oversized image, or with a disallowed file extension produces an inline error and the form is not submitted.

**AC-04 — Issue listing and filtering:**
All issues in the database are visible on `GET /` sorted by impact score descending. Applying a keyword search via `?q=` returns only issues whose title or description contains the keyword. Applying category, location, status, and severity filters in isolation and in combination returns the correct subset of issues.

**AC-05 — Issue detail:**
`GET /issues/<id>` displays all required fields: title, description, category, location, severity, reporter name, date submitted, status, upvote count, impact score, attached image (if any), and all admin remarks in chronological order. A request for a non-existent ID returns a 404 error page.

**AC-06 — Upvoting:**
A logged-in student can upvote an issue they did not report; the count increments by 1 without a full-page reload. Clicking the upvote button a second time removes the upvote and decrements the count. Attempting to upvote one's own issue returns a 403 JSON error. Attempting to upvote while logged out returns a 401 JSON error.

**AC-07 — Impact score:**
The impact score for at least two issues is manually verified against the formula `(upvote_count × 3) + (severity_weight × 5) + min(days_open, 30)`. The listing page is sorted in strict descending order by impact score.

**AC-08 — Student profile:**
`GET /profile` for a logged-in student shows two sections: issues they reported and issues they upvoted, each with current status and a link to the detail page.

**AC-09 — Admin dashboard:**
An admin can access `GET /admin/`, see all issues sorted by impact score, filter by status, category, and severity, and click through to any issue's detail page.

**AC-10 — Admin status update and remark:**
An admin can change an issue's status from `Open` to `In Progress` and from `In Progress` to `Resolved`. An admin can add a remark; the remark appears on the public detail page with a timestamp. An empty remark field does not create a remark row.

**AC-11 — Security baseline:**
Passwords are stored as hashes (verified by inspecting the database — no plaintext present). The `SECRET_KEY` is set via an environment variable, not hardcoded in source. Admin routes return 403 for student accounts when accessed directly. No raw Python traceback is ever shown to a user in the browser.

**AC-12 — Usability baseline:**
All form fields have associated labels. The application is usable on a 375 px mobile viewport without horizontal scrolling. At least 3 real students (not the developer) complete the full flow — register, report an issue or upvote, and view their profile — without developer assistance.

**AC-13 — Real-user pilot:**
The deployed application accumulates at least 25 non-test registered users, at least 10 of whom submitted at least one issue, and at least 15 of whom upvoted at least one issue. At least 3 issues have received an admin status update. These counts are verified by direct SQLite query.
