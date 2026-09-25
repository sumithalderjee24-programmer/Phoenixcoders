# Phoenix Coders🐦‍🔥

# CampusFix 🏫🛠️



> CampusFix gives students and campus staff one shared place to report facility problems and see what happens next.

---

### Contents
- [Why we're building this](#why-were-building-this) 
- [Project Documentation](#project-documentation)  
- [Wireframe & Screen Flow](#wireframe--screen-flow)  
- [Tech Stack](#tech-stack) 
- [What I'm Building Toward](#what-im-building-toward) 
- [Next Up](#next-up-sprint-1)

---

## Why we're building this

Right now, a broken fan or a leaking tap gets handled the same informal way every time:
- Mentioned once in a hostel group chat — easy to miss, easy to assume someone else already flagged it.
- Told to a staff member in passing — no record, no way to check later if it was actually escalated.
- Reported five separate times by five separate students, because nobody could see it had already been logged.

Meanwhile, the student affected most — the one whose lab session depends on that Wi-Fi router — has no way to signal that urgency, and no way to know if anyone is even looking at it.

CampusFix fixes this with one shared, searchable queue. Students report an issue with its location and severity, upvote the ones affecting them, and watch its status change from *Open* to *In Progress* to *Resolved*. Admins sort and filter by impact score — how many students an issue affects — and post a remark each time they update it. It's built for undergraduate students at one engineering college and the staff who manage its facilities.

---

## Project Documentation

- [**PRD.md**](./docs/PRD.md) — Problem breakdown, target persona (college student), MVP scope, and test metrics.
- [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) — System flow, component diagram, tech choices, and DB schema.
- [**API_SPEC.md**](./docs/API_SPEC.md) — Backend endpoints, auth flow, and error payloads.
- [**REQUIREMENTS.md**](./docs/REQUIREMENTS.md) — Functional specs (FR-01 to FR-15), performance targets, and constraints.
- [**ROADMAP.md**](./docs/ROADMAP.md) — 8-week breakdown across Kenshi (MVP), Samurai, and Shogun milestones.

---

## Wireframe & Screen Flow

The Kenshi prototype ships as **eight static HTML/CSS screens** — hand-built, hardcoded data, no backend behind any of it yet — split across a student flow and an admin flow.

![CampusFix Wireframe & User Flow](https://github.com/sumithalderjee24-programmer/Phoenixcoders/blob/bf72dae43fbac5bdef0f06703f1ca30ac4c86137/docs/sketch.png)

**Student flow**

| Screen | Purpose |
| --- | --- |
| **K1** — `login.html` | Email + password login, link into registration |
| **K2** — `register.html` | Name / email / password sign-up, with a static "account created" notice |
| **K3** — `index.html` | Searchable, filterable issue listing — by category, status, and severity — with upvote counts and impact scores |
| **K4** — `issue_detail.html` | Full description, students-affected count, impact score, status history, and a "Support this issue" upvote |
| **K5** — `report_issue.html` | Report form: title, description, location, category, severity, optional photo (max 2MB) |
| **K6** — `profile.html` | A student's own **Issues Reported** and **Issues Supported**, both linking back into K4 |

**Admin flow**

| Screen | Purpose |
| --- | --- |
| **K7** — `admin_dashboard.html` | Totals (open / in progress / resolved), a "high-impact" alert, and a sortable, filterable issue table |
| **K8** — `admin_issue_detail.html` | Same detail view as K4, plus admin controls: update status and add an optional remark |

Excalidraw link: [Open CampusFix Wireframe & User Flow](https://excalidraw.com/#json=2hNRhurUrBRqPz6XRNDm6,zKtMzOvJWDUiKptXIa54ag)

<details>
<summary><strong>Flow at a glance</strong> (click to expand)</summary>



**Scope:** Kenshi = static HTML/CSS prototype. No Flask, no SQLite, no real auth, no real upvoting.
</details>

---

## Tech Stack

| Layer    | Technology | Why |
| -------- | ---------- | --- |
| Frontend | Jinja2 templates; plain CSS (single stylesheet); minimal vanilla JavaScript | Server-rendered HTML needs no build step; CSS is sufficient for the MVP; JavaScript handles the upvote toggle and filter form submission |
| Backend  | Python 3.x + Flask | Specified in the PRD; lightweight, well-documented, and beginner-friendly |
| Database | SQLite (single `.db` file) | Zero-config, file-based, and sufficient for ≤ 100 concurrent users at MVP scale |
| Auth     | Flask-Login | Manages sessions, `current_user`, and `@login_required` |
| Hosting  | Local machine or any shared host with Python support (e.g. PythonAnywhere) | Requires no cloud infrastructure and matches the PRD deployment target |

---

## What I'm Building Toward

### 🥋 Kenshi — frontend
Eight browser-ready static HTML screens (K1–K8 above): login, registration, issue listing, issue detail, issue reporting, student profile, admin dashboard, and admin issue detail. Hardcoded data and working links demonstrate the screens and navigation, including a layout usable at 375px wide. Forms are placeholders — there is no Flask server, Jinja2, database, session, real authentication, or real upvoting yet.

### ⚔️ Samurai — full-stack
Samurai turns the Kenshi screens into a working Flask app: Jinja2 templates backed by SQLite, validated forms, student registration and login, a seeded admin account, issue reporting with optional photos, searchable and filterable issue listings, upvotes, student profiles, impact-score sorting, and admin status updates with remarks. Its completion point is a locally running app (`flask run`) that stores real records in `campusfix.db` and passes the PRD acceptance checklist, including access controls and the full student and admin flows.

### 🏯 Shogun — production
Shogun is complete when the app is live at a public URL, security and error handling are checked, and students can use it on mobile with labeled forms. At least three students must complete the main flow without help before launch. Then a two-week pilot must reach 25 or more non-test student accounts, each with at least one meaningful action (reporting or upvoting); the roadmap also targets 10 issue submitters, 15 upvoters, 20 real issues, 5 issues with at least 2 upvotes, 3 admin status updates, 30% returning on another calendar day, and a survey of at least 10 students with 70% saying CampusFix made reporting easier.

---

## Next Up (Sprint 1)

- [ ] Scaffold the Flask app structure (`app.py`, blueprints, `templates/`, `static/`)
- [ ] Set up `campusfix.db` (SQLite) using the schema from `ARCHITECTURE.md`
- [ ] Port K1/K2 (login & register) to Jinja2 templates with Flask-Login
- [ ] Wire K3 (issue listing) to real query, search, and filter logic
- [ ] Seed one admin account for testing K7/K8

---

*Submitted to Journey to Mastery — Level 1: Ronin*
