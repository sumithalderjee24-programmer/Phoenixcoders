# CampusFix — Roadmap

**Version:** 1.0  
**Status:** MVP  
**Source of truth:** PRD.md v1.0, ARCHITECTURE.md v1.0, API_SPEC.md v1.0  
**Last Updated:** 2026-09-24

---

## 1. Development Philosophy

CampusFix is built in three stages that mirror how a real product matures: first you make it look right, then you make it work, then you put it in front of real people and confirm it solves their problem.

**Kenshi (Frontend / Prototype):** Build every screen as a static HTML file with hardcoded data. No server, no database, no real logins. The goal is to validate the layout, the navigation flow, and the overall product shape before writing a single line of Flask. Bugs caught here cost ten minutes. Bugs caught after the backend is built cost hours.

**Samurai (Full-Stack / Functional MVP):** Wire the Kenshi templates into a real Flask application backed by SQLite. Every PRD feature gets implemented end-to-end: real authentication, real issue storage, real upvoting, real admin controls, and a correct impact score. At the end of Samurai, the application is locally runnable and passes every acceptance criterion in the PRD.

**Shogun (Production / Real Users):** Deploy to a publicly accessible URL, harden the application against the most common failure modes, run a structured pilot with at least 25 real students, collect feedback, and verify that the tool actually helps people report campus issues. Shogun does not add new features — it makes what already exists reliable enough for people who didn't build it to use confidently.

This ordering has one non-negotiable rule: **Samurai cannot begin until Kenshi is complete, and Shogun cannot begin until Samurai passes its acceptance checklist.** Skipping ahead produces half-finished stages and a product that looks done but isn't.

---

## 2. Kenshi — Frontend

**What Kenshi is:** A set of static HTML + CSS pages that demonstrate every screen and user flow without a running server. Data is hardcoded directly in the templates. Forms do not submit to a real backend — the submit button either links to the next page or shows a placeholder message. Jinja2 templating is not used yet; these are plain `.html` files.

**What Kenshi is not:** A working application. There is no login logic, no database, no session, no real upvote. Anyone can "navigate" to the admin dashboard by typing the URL — there is no auth gate. This is expected and fine at this stage.

**Why this stage matters:** Building the templates first means the Flask routes in Samurai only need to pass data to templates that are already designed and reviewed. It also means a collaborator or instructor can review the product before any backend work happens.

---

### Screen K1 — Login page (`login.html`)

**What it contains:**
- Application name / logo area
- Email input field
- Password input field
- "Login" button (links to `dashboard.html` for student, `admin_dashboard.html` for admin — hardcoded for prototype)
- "Create account" link pointing to `register.html`

**Done means:** The page renders correctly in a browser. All fields are visible. The login button navigates to the student dashboard. The registration link navigates to the registration page.

---

### Screen K2 — Registration page (`register.html`)

**What it contains:**
- Name input field
- Email input field
- Password input field
- "Create account" submit button (links to `login.html` with a static success notice)
- "Already have an account? Log in" link

**Done means:** The page renders. The button navigates back to login. Field labels are correct. The form layout matches the wireframe.

---

### Screen K3 — Issue listing page (`index.html`)

**What it contains:**
- Navigation bar: "CampusFix" logo / name, "Browse" (active), "Report an issue" link, "Profile" link, "Log out" link
- Search bar (no functionality — static)
- Filter dropdowns: Category, Status, Severity (no functionality — static)
- At least 4 hardcoded issue cards, each showing:
  - Title
  - Category badge
  - Severity badge
  - Location
  - Status badge (Open / In Progress / Resolved — at least one of each across the 4 cards)
  - Upvote count ("▲ 8")
  - Impact score ("Score: 44")
- Clicking any card navigates to `issue_detail.html`

**Done means:** Four cards render with realistic dummy data. Badges are visually distinguishable by status (e.g. different text colour). Clicking a card reaches the detail page.

---

### Screen K4 — Issue detail page (`issue_detail.html`)

**What it contains:**
- Back link → `index.html`
- Issue title (h1)
- Category badge, Severity badge, Status badge
- Location, reporter display name, date reported
- Full description paragraph
- Image placeholder box (or a real placeholder image)
- Upvote count ("▲ 12 students affected")
- Impact score display ("Impact score: 71")
- "▲ Support this issue" button (static — clicking shows count increment as a hardcoded second state, or simply does nothing)
- Status history section: 2–3 hardcoded history entries (e.g. "12 Sep — Reported (Open)", "15 Sep — In progress — Electrician scheduled")

**Done means:** All fields are visible with realistic dummy data. The upvote button is present. The status history section shows at least two entries. The page is readable on a mobile-width browser window (basic responsive check).

---

### Screen K5 — Report issue form (`report_issue.html`)

**What it contains:**
- Navigation bar (same as K3)
- Page heading: "Report a campus issue"
- Fields (all present, no validation):
  - Title (text input)
  - Description (textarea)
  - Category (select dropdown with all 8 options: Electrical, Plumbing, Furniture, Wi-Fi, Washroom, Lab Equipment, Hostel, Other)
  - Location (text input)
  - Severity (select dropdown: Low, Medium, High)
  - Image upload (file input, labelled "Optional — max 2 MB")
- "Submit report" button (links to `issue_detail.html` — simulating a successful submission redirect)
- Required field indicators (`*`)

**Done means:** All fields render. The category and severity dropdowns contain the correct options matching the PRD. Submitting navigates to the detail page.

---

### Screen K6 — Student profile page (`profile.html`)

**What it contains:**
- Navigation bar
- Student name displayed
- "Issues I reported" section: 2 hardcoded issue cards with current status visible
- "Issues I support" section: 2 hardcoded issue cards (different issues) with current status visible
- Each card links to `issue_detail.html`

**Done means:** Both sections are present and visually distinct. Status is clearly shown on each card.

---

### Screen K7 — Admin dashboard (`admin_dashboard.html`)

**What it contains:**
- Navigation bar indicating admin context ("ADMIN — CampusFix")
- Summary row: Total, Open, In Progress, Resolved counts (hardcoded numbers)
- High-impact alert: "5 issues with impact score > 60" (hardcoded)
- Filter dropdowns: Category, Status, Severity (static)
- Issue table or card list sorted by impact score (hardcoded descending order):
  - At least 4 issues with impact score, upvote count, status, category, severity, reporter, date
- Clicking any issue navigates to `admin_issue_detail.html`

**Done means:** All summary numbers are visible. The issue list shows at least 4 items in descending score order. The admin nav is visually distinct from the student nav.

---

### Screen K8 — Admin issue detail page (`admin_issue_detail.html`)

**What it contains:**
- All content from K4 (full issue info, status history)
- Additional admin-only section at the bottom:
  - "Update status" label
  - Status dropdown (Open / In Progress / Resolved)
  - Remark textarea
  - "Update status" button (links back to `admin_dashboard.html` — simulating a successful update)
- Impact score and upvote count prominently displayed

**Done means:** The admin section is visually separated from the public issue content. The dropdown and textarea render. The button navigates back to the dashboard.

---

### Kenshi: what is intentionally absent

- No Flask, no Python, no database
- No real form validation
- No real authentication — any URL is accessible
- No real upvote toggle logic
- No image actually uploads
- No session or cookie

These are all Samurai's responsibility.

---

## 3. Samurai — Full Stack

**What Samurai does:** Converts the Kenshi HTML files into a real Flask application. Each static `.html` file becomes a Jinja2 template. Each hardcoded data array becomes a SQLite query. Each form becomes a validated `POST` handler with a redirect.

At the end of Samurai, the application runs locally with `flask run`, stores real data in `campusfix.db`, and every acceptance criterion in the PRD is checkable by hand.

Samurai is divided into five sub-stages to prevent the entire backend from being "in progress" at once. Complete each sub-stage fully before starting the next.

---

### Samurai sub-stage S1 — Project setup and database

**Tasks:**
1. Create the Flask project structure:
   ```
   campusfix/
   ├── app/
   │   ├── __init__.py        (app factory, extensions init)
   │   ├── models.py          (User, Issue, Upvote, IssueRemark)
   │   ├── routes/
   │   │   ├── auth.py
   │   │   ├── issues.py
   │   │   ├── profile.py
   │   │   └── admin.py
   │   ├── templates/         (move Kenshi HTML files here)
   │   └── static/
   │       ├── css/
   │       └── uploads/
   ├── config.py
   ├── run.py
   └── requirements.txt
   ```
2. Install dependencies: `flask`, `flask-login`, `flask-sqlalchemy`, `werkzeug`
3. Define all four models in `models.py`:
   - `User` (id, name, email, password_hash, is_admin, created_at)
   - `Issue` (id, title, description, category, location, severity, status, image_path, reporter_id, created_at, updated_at)
   - `Upvote` (id, user_id, issue_id, created_at) with `UNIQUE(user_id, issue_id)` constraint
   - `IssueRemark` (id, issue_id, admin_id, remark, status_at_time, created_at)
4. Write `flask db-init` CLI command to create the database schema
5. Write `flask seed-admin` CLI command to insert one admin user
6. Write `flask seed-demo` CLI command to insert 5 realistic sample issues (used for local testing — not shipped to production)

**Done means:** Running `flask db-init && flask seed-admin && flask seed-demo && flask run` starts the server without errors. The `.db` file is created. All four tables exist and can be queried with a SQLite browser.

**PRD features started:** Foundation for all 14 features.

---

### Samurai sub-stage S2 — Authentication (F1, F2)

**Tasks:**
1. Convert `login.html` and `register.html` to Jinja2 templates with `{{ form_error }}` blocks
2. Implement `GET /auth/register` and `POST /auth/register`:
   - Validate name (2–100 chars), email (unique, valid format), password (8–128 chars)
   - Hash password with `generate_password_hash`
   - Insert `User` row with `is_admin = False`
   - Redirect to `/auth/login` on success
   - Re-render form with inline errors on failure
3. Implement `GET /auth/login` and `POST /auth/login`:
   - Look up user by email
   - Call `check_password_hash`
   - Call `login_user(user)` on success
   - Redirect student to `/`, admin to `/admin/`
   - Re-render form with generic error on failure (do not distinguish wrong email from wrong password)
4. Implement `POST /auth/logout`:
   - Call `logout_user()`
   - Redirect to `/auth/login`
5. Implement `@admin_required` decorator
6. Test: register → login → verify session → logout → verify session cleared

**Done means:** A real account can be created, logged into, and logged out of. The admin seed account logs in and is redirected to `/admin/` (even though that page is not built yet — a placeholder 200 response is acceptable here). An unauthenticated GET to `/issues/new` redirects to login.

**PRD features completed:** F1, F2.

---

### Samurai sub-stage S3 — Issue listing, detail, search, filter (F3, F4, F5, F6, F8, F9, F10, F11)

This is the largest sub-stage. All read paths are built before any write paths.

**Tasks:**
1. Convert `index.html` to a Jinja2 template that loops over `issues` passed from the route
2. Implement `GET /`:
   - Read query params: `q`, `category`, `location`, `status`, `severity`
   - Build SQLAlchemy query with `.filter()` clauses for each active param
   - For keyword search: `Issue.title.ilike(f'%{q}%') | Issue.description.ilike(f'%{q}%')`
   - Fetch all matching issues
   - Compute `impact_score` for each in Python using `compute_impact_score(issue, upvote_count)`
   - Sort the result list by impact score descending in Python
   - If logged in, fetch the set of issue IDs the current user has upvoted
   - Render `issues/list.html`
3. Convert `issue_detail.html` to a Jinja2 template
4. Implement `GET /issues/<int:id>`:
   - Fetch issue by ID, 404 if not found
   - Fetch upvote count (COUNT from upvotes table)
   - Compute impact score
   - Fetch all remarks for this issue (ordered by created_at ASC)
   - If logged in, compute `user_has_upvoted` and `user_is_reporter`
   - Render `issues/detail.html`
5. Write the `compute_impact_score(issue, upvote_count)` helper function:
   ```python
   SEVERITY_WEIGHT = {"Low": 1, "Medium": 2, "High": 3}

   def compute_impact_score(issue, upvote_count):
       days_open = (datetime.utcnow() - issue.created_at).days
       age_bonus = min(days_open, 30)
       return (upvote_count * 3) + (SEVERITY_WEIGHT[issue.severity] * 5) + age_bonus
   ```
6. Test all filter combinations manually with seed data
7. Test that the search is case-insensitive

**Done means:** The listing page shows all seeded issues sorted by impact score. All four filter dropdowns work independently and in combination. The detail page shows all fields including the hardcoded remarks from seed data. Impact score is computed correctly for at least two manually verified examples.

**PRD features completed:** F4, F5, F6, F8, F9, F10, F11 (display).

---

### Samurai sub-stage S4 — Write paths: reporting, upvoting, profile (F3, F7, F12)

**Tasks:**
1. Implement `GET /issues/new` (`@login_required`):
   - Render `issues/new.html` with dropdown option lists
2. Implement `POST /issues/new` (`@login_required`):
   - Validate all fields per API_SPEC validation rules
   - If image present: check extension (allowlist) and size (≤ 2 MB), save as `uuid4().hex + ext` to `app/static/uploads/`, store `uploads/<filename>` in `image_path`
   - Insert `Issue` row with `reporter_id = current_user.id`, `status = 'Open'`
   - Redirect to `GET /issues/<new_id>` (POST-Redirect-GET)
   - On validation failure: re-render form with inline errors (do not lose field values)
3. Implement `POST /issues/<int:id>/upvote` (`@login_required`):
   - Return `401 JSON` if not logged in
   - Return `404 JSON` if issue not found
   - Return `403 JSON` if `current_user.id == issue.reporter_id`
   - Check if upvote row exists for `(current_user.id, issue.id)`
   - If not: `INSERT` into `upvotes`; if yes: `DELETE` from `upvotes`
   - Wrap INSERT in `try/except IntegrityError` as a safety net
   - Recount upvotes and return `{"action": "added"|"removed", "upvote_count": N}`
4. Add the upvote button JavaScript to `issue_detail.html`:
   - On click: `fetch('POST /issues/<id>/upvote')`, parse JSON response
   - Update count display and toggle button state without page reload
   - If 401 returned: `window.location.href = '/auth/login'`
5. Implement `GET /profile` (`@login_required`):
   - Query issues where `reporter_id = current_user.id`
   - Query issues joined via `upvotes` where `user_id = current_user.id`
   - Compute impact score for each
   - Render `profile/index.html`
6. Test: submit an issue with and without an image, verify it appears on the listing sorted correctly. Upvote an issue and verify count increments. Upvote again and verify it decrements. Attempt to upvote own issue and verify 403. Verify profile page shows correct sets.

**Done means:** A student can complete the full primary flow: register → log in → browse issues → upvote → report new issue → see it on the listing → check profile page. Image upload works for jpg/png/webp. The upvote toggle updates without a page reload.

**PRD features completed:** F3, F7, F12.

---

### Samurai sub-stage S5 — Admin dashboard and status updates (F2, F13, F14)

**Tasks:**
1. Convert `admin_dashboard.html` to a Jinja2 template
2. Implement `GET /admin/` (`@admin_required`):
   - Query all issues, apply optional filters (category, status, severity)
   - Compute impact score for each
   - Sort by impact score descending
   - Compute summary counts: total, open, in_progress, resolved
   - Render `admin/dashboard.html`
3. Implement `POST /admin/issues/<int:id>/update` (`@admin_required`):
   - Validate `status` is one of `Open`, `In Progress`, `Resolved`
   - Validate `remark` ≤ 500 characters if provided
   - `UPDATE issues SET status = <new_status>, updated_at = now() WHERE id = <id>`
   - If remark non-empty after strip: `INSERT INTO issue_remarks (...)`
   - Redirect to `GET /issues/<id>`
4. Ensure the admin issue detail view (the public `GET /issues/<id>` page) shows the admin update form only when `current_user.is_admin` — use `{% if current_user.is_admin %}` in the template (no separate admin detail route needed)
5. Test: log in as admin, view dashboard, filter by High severity, open an issue, change status to "In Progress" with a remark, verify the remark appears with a timestamp on the public detail page, verify the status badge updates, verify the admin dashboard reflects the new status

**Done means:** Admin can log in, see all issues sorted by impact score, filter by status and severity, update any issue's status, and add a remark. The remark appears on the public issue detail page with a timestamp immediately after submission.

**PRD features completed:** F13, F14 (F2 was completed in S2).

---

### Samurai: full feature completion summary

| PRD Feature | Sub-stage |
|---|---|
| F1 — Student registration and login | S2 |
| F2 — Admin login | S2 |
| F3 — Issue reporting with optional image | S4 |
| F4 — Issue listing page (public) | S3 |
| F5 — Keyword search | S3 |
| F6 — Filter by category / location / status / severity | S3 |
| F7 — Upvoting (toggle, own-issue guard, DB constraint) | S4 |
| F8 — Issue detail page | S3 |
| F9 — Impact score computation | S3 |
| F10 — Default sort by impact score | S3 |
| F11 — Status visible everywhere | S3 |
| F12 — Student profile page | S4 |
| F13 — Admin dashboard | S5 |
| F14 — Admin status update and remark | S5 |

---

## 4. Shogun — Production and Real Users

**What Shogun does:** Takes the locally functional Samurai application and makes it genuinely usable by people who are not the developer. This means: accessible at a public URL, hardened against common failures, tested with real students, and measured against the PRD's 25-user target.

Shogun adds no new product features. Every item below is either infrastructure, error handling, hardening, or validation.

---

### Shogun task SH1 — Deployment

**Tasks:**
1. Choose a host: PythonAnywhere (free tier) is the simplest choice for a Flask + SQLite student project. Requires no credit card for the free tier, supports Python 3, and serves Flask apps via WSGI with minimal configuration.
2. Create a PythonAnywhere account, upload the project, configure the WSGI file to point to the Flask app
3. Set `SECRET_KEY` as an environment variable (not hardcoded in `config.py`)
4. Set `FLASK_ENV=production` (disables debug mode and the interactive debugger)
5. Verify the `campusfix.db` file is in a persistent directory (not the source tree root)
6. Verify the `static/uploads/` directory is writable and images upload correctly on the live host
7. Confirm the application is accessible at a public URL and the student can share that URL with others

**Done means:** A classmate who has never seen the project can open the URL on their phone, register, browse issues, and submit a report — without any help from the developer.

---

### Shogun task SH2 — Security hardening

**Tasks:**
1. Confirm `SECRET_KEY` is a long random string set via environment variable — not `"dev"` or `"secret"`
2. Confirm `FLASK_DEBUG=False` in production
3. Confirm passwords are hashed (Werkzeug PBKDF2) — double-check the registration route stores the hash, not plaintext
4. Confirm the image upload directory is not executable (images served statically, not executed)
5. Confirm file extension allowlist is enforced server-side (not just client-side)
6. Confirm all database queries use SQLAlchemy ORM parameterized queries — no raw string interpolation of user input into SQL
7. Confirm the `@admin_required` decorator is applied to all admin routes — test by logging in as a student and manually navigating to `/admin/`
8. Confirm that a student cannot upvote their own issue by posting directly to the endpoint (not just via the UI)

**Done means:** All eight checks above pass. No plaintext passwords in the database. Debug mode is off. Raw SQL injection is not possible via any form field.

---

### Shogun task SH3 — Error handling and stability

**Tasks:**
1. Implement custom error pages for 404, 403, and 500:
   - `errors/404.html`: "Page not found — go back to the issue list"
   - `errors/403.html`: "You don't have permission to view this"
   - `errors/500.html`: "Something went wrong — the error has been logged"
2. Add error handlers in `app/__init__.py`
3. Test each error page by deliberately triggering it (visit `/issues/99999`, visit `/admin/` as a student, trigger a division-by-zero in a test route)
4. Ensure flash messages display correctly on all form pages (registration errors, login errors, successful status update)
5. Test the image upload with: a correctly sized jpg, a correctly sized png, a file that is too large (expect client-side rejection then server-side rejection), and a `.php` file (expect rejection)
6. Test the upvote endpoint without being logged in (expect redirect to login, not a 500)

**Done means:** No unhandled exception reaches the user as a raw traceback. Every error state shows a readable page or message.

---

### Shogun task SH4 — Basic accessibility and usability

**Tasks:**
1. All form fields have `<label>` elements associated via `for`/`id` attributes
2. All images (including user-uploaded issue photos) have `alt` attributes
3. Status badges have sufficient colour contrast — do not rely on colour alone (add a text label: "Open", not just a green dot)
4. Navigation is keyboard-accessible (tab order is logical)
5. The application is usable on a mobile browser at 375px width (test on Chrome DevTools mobile emulation)
6. Flash messages are visible and disappear after one page load (not permanently shown)

**Done means:** A student can complete the full student flow using only a keyboard. The application is usable on a mid-range Android phone browser.

---

### Shogun task SH5 — Pre-launch student validation

Before asking 25 students to register, do a structured test with 3–5 people:

1. **Identify 3–5 willing classmates** who were not involved in building CampusFix
2. **Give them the URL and one sentence:** "This is a campus issue reporting tool — try to report a problem you've seen recently."
3. **Watch silently** while they use it. Do not explain how it works. Note where they hesitate or get confused.
4. **After 10 minutes, ask:**
   - Did you understand what the site does within 30 seconds?
   - Was there anything confusing about reporting an issue?
   - Did you try to upvote an existing issue or only create a new one?
   - Would you use this again if a problem came up?
5. **Act on findings before the broader launch.** Common issues at this stage: the upvote button is not discoverable, the "Category" dropdown has options students don't understand, the search bar is easy to miss.

**Done means:** At least 3 students complete the full flow (register → browse → report or upvote) without being guided. At least 2 say they would use it again. Critical confusions (anything that causes a student to stop and say "I don't know what to do here") are fixed before the broader launch.

---

### Shogun task SH6 — Onboarding 25 real users

**Target:** 25 distinct students who have registered an account and performed at least one meaningful action (report or upvote) — matching the PRD's definition of a real user.

**Approach:**
1. **Identify 30 willing participants before launch** (not after). Use classmates, hostel mates, and students from your own year who have experienced campus infrastructure problems. 30 gives buffer for the ~5 who will register but never take an action.
2. **Send one clear message** (WhatsApp or in person): "I built a tool to report campus issues — here's the link. It takes 2 minutes. If you've seen a broken fan, a leaking tap, or a Wi-Fi problem, please report it." Include the URL and optionally one sentence on what to do when they land on the page.
3. **Seed 3–5 real issues yourself** before inviting anyone else. An empty listing page discourages first-time users. Seeing existing issues with upvotes makes the platform feel alive.
4. **Brief the admin** (facility staff, hostel warden, or your project supervisor acting as a test admin) before launch. Confirm they will log in and update at least one issue's status during the pilot period. Without at least one status update from an admin, students have no reason to return.
5. **Give it two weeks.** Do not judge adoption in the first 48 hours.

**Done means:** At least 25 non-test users have registered. At least 10 have submitted at least one issue. At least 15 have upvoted at least one issue. These numbers are queryable directly from the SQLite database.

---

### Shogun task SH7 — Measuring real usage

**Metrics to collect (queried from SQLite):**

```sql
-- Total non-test registered users
SELECT COUNT(*) FROM users WHERE is_admin = 0 AND email NOT LIKE '%test%';

-- Users who submitted at least one issue
SELECT COUNT(DISTINCT reporter_id) FROM issues;

-- Users who upvoted at least one issue
SELECT COUNT(DISTINCT user_id) FROM upvotes;

-- Total issues submitted
SELECT COUNT(*) FROM issues;

-- Issues with at least 2 upvotes
SELECT COUNT(*) FROM (
  SELECT issue_id FROM upvotes GROUP BY issue_id HAVING COUNT(*) >= 2
);

-- Issues with at least one admin status update
SELECT COUNT(DISTINCT issue_id) FROM issue_remarks;

-- Users who logged in more than once (approximated by having upvotes or issues created on different days)
-- (requires checking created_at spread across issues and upvotes per user)
```

**Survey (run at end of week 2, via Google Form or paper):**
1. Did you report or upvote an issue on CampusFix? (Yes / No)
2. Did you check back to see if the status changed? (Yes / No / I didn't know I could)
3. Did CampusFix make it easier to report a campus problem compared to WhatsApp or doing nothing? (Yes / No / Same)

**Done means:** All PRD success metrics have been measured and recorded. At minimum, the 25-user target is met.

---

### Shogun task SH8 — Issue quality validation

A technical metric (25 users registered) is necessary but not sufficient. The following must also be confirmed:

1. **Are reported issues real?** Spot-check 5 issues submitted by real students. Are they genuine campus problems (broken infrastructure, Wi-Fi, washroom) rather than test entries?
2. **Are issues actionable?** Could a facility staff member understand what the issue is and where to find it, based only on the issue title, description, and location field?
3. **Did the admin take action?** At least one issue must have been moved from Open to In Progress or Resolved with a real remark (not a placeholder like "test").
4. **Do students return after their first session?** Query `upvotes` and `issues` tables: how many users have activity on at least two different calendar dates?

If any of these checks fail, document what went wrong (e.g. "location field was too vague — students wrote 'hostel' instead of a specific room") and record it as a post-MVP improvement.

**Done means:** At least 10 real, actionable issues are in the database. At least 1 issue has received a genuine admin status update. At least 30% of registered non-test users have activity on more than one day.

---

## 5. Timeline

All weeks are relative to the start of development. These are estimates for a student developer working part-time alongside coursework. Adjust if you have more or less available time.

```
Week 1         Kenshi — All 8 static screens built and reviewed
               ↓
Week 2         Samurai S1 — Project setup, models, DB schema, seed commands
               ↓
Week 3         Samurai S2 — Auth (register, login, logout, admin decorator)
               Samurai S3 — Issue listing, detail, search, filter, impact score
               ↓
Week 4         Samurai S4 — Issue reporting form, upvoting (JSON endpoint + JS), profile page
               Samurai S5 — Admin dashboard, admin status update + remarks
               ↓
Week 5         Samurai complete — full local testing against PRD acceptance criteria
               Fix bugs found in self-testing
               ↓
Week 6         Shogun SH1 — Deploy to PythonAnywhere
               Shogun SH2 — Security hardening checklist
               Shogun SH3 — Error handling and stability testing
               ↓
Week 7         Shogun SH4 — Accessibility and mobile usability check
               Shogun SH5 — Pre-launch validation with 3–5 classmates
               Fix issues found in pre-launch test
               ↓
Week 8–9       Shogun SH6 — Onboard 25+ real users (2-week pilot period)
               Shogun SH7 — Collect usage metrics mid-pilot and at end
               ↓
Week 10        Shogun SH8 — Issue quality validation + survey results
               Write pilot summary (what worked, what didn't, what would change)
               Roadmap complete ✓
```

**Buffer:** Weeks 3–4 are the most likely to slip. S3 (listing + filtering + impact score) is the most complex sub-stage. Do not compress it. If S3 takes an extra three days, push S4 and S5 rather than cutting scope.

---

## 6. Milestone Acceptance Criteria

### Kenshi — complete when all of the following are true

- [ ] All 8 screens (`login.html`, `register.html`, `index.html`, `issue_detail.html`, `report_issue.html`, `profile.html`, `admin_dashboard.html`, `admin_issue_detail.html`) exist as static `.html` files
- [ ] Every screen renders in a browser without broken images or missing CSS
- [ ] Navigation links between screens work (login → dashboard, index → detail, report form → detail, admin dashboard → admin detail)
- [ ] The category dropdown in the report form contains all 8 PRD-specified categories
- [ ] The severity dropdown contains Low, Medium, High
- [ ] Status badges are visually distinct across the three states (Open / In Progress / Resolved)
- [ ] Admin screens are visually distinct from student screens (different nav or header)
- [ ] All screens are readable on a 375px-wide viewport (no horizontal scrollbar, no overlapping text)
- [ ] No backend code exists yet

### Samurai — complete when all of the following are true

**Authentication (F1, F2)**
- [ ] Student registration works with real validation (duplicate email rejected, short password rejected)
- [ ] Student login works; wrong password shows a generic error
- [ ] Admin seed account (`flask seed-admin`) logs in and is redirected to `/admin/`
- [ ] `@login_required` routes redirect unauthenticated users to `/auth/login`
- [ ] `@admin_required` routes return 403 for logged-in students

**Issue listing and detail (F4, F5, F6, F8, F9, F10, F11)**
- [ ] All issues in the database appear on `GET /` sorted by impact score descending
- [ ] Keyword search (`?q=`) filters by title and description, case-insensitively
- [ ] Each of the four filters (category, location, status, severity) works independently
- [ ] Multiple filters applied simultaneously work correctly
- [ ] `GET /issues/<id>` returns 404 for a non-existent ID
- [ ] Impact score is computed correctly: manually verify formula for at least two issues

**Issue reporting (F3)**
- [ ] A logged-in student can submit an issue with all required fields
- [ ] Submitting without a title shows an inline error; form data is preserved
- [ ] An image (jpg, png, webp) uploads successfully and displays on the detail page
- [ ] A `.php` file upload is rejected with an error message
- [ ] A 3 MB image upload is rejected with an error message
- [ ] After successful submission, the student is redirected to the new issue's detail page
- [ ] The new issue appears on the listing sorted by its initial impact score

**Upvoting (F7)**
- [ ] A logged-in student can upvote an issue they did not report; count increments without page reload
- [ ] Clicking upvote again removes the upvote; count decrements
- [ ] Attempting to upvote own issue returns a 403 JSON error
- [ ] Attempting to upvote while logged out returns a 401 JSON error
- [ ] Manually inserting a duplicate row into `upvotes` raises an IntegrityError (DB constraint verified)

**Profile (F12)**
- [ ] `/profile` shows issues the current user reported with correct statuses
- [ ] `/profile` shows issues the current user upvoted with correct statuses
- [ ] A student cannot view another student's profile (no `/profile/<user_id>` route exists)

**Admin (F13, F14)**
- [ ] Admin dashboard shows all issues sorted by impact score descending
- [ ] Admin dashboard filters by status, category, and severity work
- [ ] Admin can change an issue's status from Open → In Progress
- [ ] Admin can change status from In Progress → Resolved
- [ ] Admin can add a remark; it appears on the public detail page with a timestamp
- [ ] A student navigating to `/admin/` receives a 403

**All PRD acceptance criteria from Section 10 pass.**

### Shogun — complete when all of the following are true

**Deployment**
- [ ] Application is accessible at a public URL (not `localhost`)
- [ ] `SECRET_KEY` is set via environment variable, not hardcoded
- [ ] `FLASK_DEBUG=False` in production
- [ ] A classmate on a different device can register and submit an issue without developer assistance

**Security**
- [ ] All 8 security hardening checks (SH2) pass
- [ ] Admin routes return 403 for student accounts when accessed directly via URL

**Error handling**
- [ ] Custom 404, 403, and 500 pages are in place and tested
- [ ] No raw Python traceback is ever shown to a user

**Accessibility and usability**
- [ ] All form fields have associated `<label>` elements
- [ ] Application is usable on a 375px mobile viewport
- [ ] Pre-launch validation (SH5) passed: at least 3 students completed the full flow unguided

**Real users**
- [ ] ≥ 25 non-test registered users (verified by database query)
- [ ] ≥ 10 users submitted at least one issue
- [ ] ≥ 15 users upvoted at least one issue
- [ ] ≥ 20 total real issues in the database
- [ ] ≥ 5 issues have ≥ 2 upvotes
- [ ] ≥ 3 issues have received an admin status update
- [ ] ≥ 30% of registered users have activity on more than one calendar day
- [ ] Post-pilot survey conducted (≥ 10 respondents)
- [ ] ≥ 70% of survey respondents say CampusFix made it easier to report a problem

---

## 7. Risks and Scope Control

### Risks that could cause the timeline to slip

| Risk | Likelihood | Mitigation |
|---|---|---|
| S3 (listing + filter + impact score) takes longer than estimated | High — this is the most code-dense sub-stage | Do not combine S3 with S4. Finish S3 fully before touching the write paths. |
| Image upload breaks on PythonAnywhere (path issues, write permissions) | Medium | Test image upload on the deployed host as the first SH1 task, not the last. |
| Admin is unavailable during the pilot | Medium | Brief the admin in Week 6, before inviting students. Confirm they will act on at least one issue during the 2-week window. |
| Students register but don't take any action | Medium | Seed 3–5 real issues before inviting anyone. An empty listing discourages first use. |
| Upvote JS fetch call breaks on certain mobile browsers | Low | Test the upvote button on Chrome Android and Safari iOS before the pre-launch test (SH5). |
| SQLite write-lock error under concurrent use | Low | Acceptable at ≤ 100 users. If it occurs, investigate connection timeout settings before considering a database change. |

### Features that will NOT be added during any milestone

The following are documented in PRD Section 8 and are confirmed out of scope for the entire MVP lifecycle, including Shogun:

- Email notifications or email verification
- Push notifications
- WhatsApp integration
- Mobile app (Android or iOS)
- AI or ML of any kind (duplicate detection, image analysis, severity prediction)
- Comment threads on issues
- Multi-college or multi-campus support
- Analytics charts or trend dashboards
- CSV export
- Public social features (sharing, likes, external links)
- Payment or gamification
- Role-based issue assignment (routing issues to specific staff members)
- Automated status transitions
- Issue editing by students after submission
- Issue deletion by students

### Scope creep triggers to watch for

These are common "just one more thing" additions that feel small but each add a day or more of work:

- "Can students comment on issues?" → No. Comments are explicitly excluded.
- "Can I add an analytics page for the admin?" → No. A sortable table is sufficient.
- "Should I send an email when the status changes?" → No. Students check the profile page.
- "Can I make it a mobile app?" → No. Responsive web is sufficient.
- "Can the admin assign issues to specific staff?" → No. The admin updates status manually.
- "Should I add a notification bell?" → No. Not in scope.

If any of these come up during development, add them to a post-MVP backlog document and keep building the current milestone.

---

## Final Consistency Check — PRD MVP Feature Lock vs. Roadmap

| PRD Feature | Kenshi | Samurai | Shogun |
|---|---|---|---|
| F1 — Student registration and login | K1, K2 (static screens) | S2 (real auth) | SH2 (hardened) |
| F2 — Admin login | K7, K8 (static screens) | S2 (admin seed + decorator) | SH2 (hardened) |
| F3 — Issue reporting + optional image | K5 (static form) | S4 (real form + upload) | SH3 (upload tested on host) |
| F4 — Issue listing page (public) | K3 (hardcoded cards) | S3 (real query) | — |
| F5 — Keyword search | K3 (static bar) | S3 (ilike query) | — |
| F6 — Filter by category / location / status / severity | K3 (static dropdowns) | S3 (query params + filter clauses) | — |
| F7 — Upvoting | K4 (static button) | S4 (JSON endpoint + JS toggle) | SH3 (tested on host) |
| F8 — Issue detail page | K4 (static detail) | S3 (real query + remarks) | — |
| F9 — Impact score | K3, K4 (hardcoded numbers) | S3 (compute_impact_score function) | — |
| F10 — Default sort by impact score | K3, K7 (hardcoded order) | S3 (Python sort) | — |
| F11 — Status tracking | K3, K4, K6 (badges) | S3 (status field on all pages) | — |
| F12 — Student profile page | K6 (static profile) | S4 (real query) | — |
| F13 — Admin dashboard | K7 (static dashboard) | S5 (real admin query) | SH2 (admin route hardened) |
| F14 — Admin status update + remark | K8 (static form) | S5 (real UPDATE + INSERT) | — |

**Result: All 14 PRD MVP features appear in the roadmap. Kenshi covers only static screens — no backend claims are made there. Shogun extends reliability and real-user validation without adding new product features.**
