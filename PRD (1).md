# CampusFix — Product Requirements Document

**Version:** 1.0  
**Status:** Draft — MVP  
**Author:** CampusFix Project Team  
**Last Updated:** 2026-09-24

---

## 1. Product Overview

CampusFix is a web-based campus issue reporting and tracking platform. It allows students to report infrastructure and facility problems on campus, upvote issues that affect them too, and track whether those issues get resolved. Administrators (facility staff, wardens, department staff) can view all reported issues, prioritize them by impact, update statuses, and close resolved ones.

The core value proposition is replacing fragmented, untracked informal complaint channels (WhatsApp forwards, verbal mentions, ignored suggestion boxes) with a single, transparent, accountable system where every complaint has a visible status and every affected student can confirm it matters to them.

**Tech stack:** Python (Flask), SQLite, Jinja2 templates, plain HTML/CSS/minimal JS.  
**Deployment target:** Local or shared hosting (no cloud infra required for MVP).  
**Primary campus:** One engineering college (used as the development and initial validation context throughout this document).

---

## 2. Problem Statement

### Who has the problem

Undergraduate students at an engineering college who regularly use classrooms, computer labs, hostels, libraries, and common facilities. They encounter broken or degraded infrastructure frequently but have no structured way to report it and no visibility into whether it will be fixed.

### What exactly happens

A student notices a broken ceiling fan in a classroom, a non-functional washroom tap in the hostel, or a damaged lab workstation. Their realistic options today are:

- Tell a classmate or a class representative verbally — no paper trail, easy to forget.
- Post in a WhatsApp group — the message gets buried within hours, no one tracks resolution.
- Walk to an administrative office — time-consuming, discouraging for minor issues, and still no tracking.
- Do nothing — especially likely if the student believes nothing will happen anyway.

### Why existing informal methods are insufficient

| Informal method | What breaks down |
|---|---|
| WhatsApp group messages | No central log, messages expire from attention, no upvoting to signal severity, no status updates |
| Verbal complaint to CR/warden | Depends on that one person following up; no visibility to other affected students |
| Physical complaint register | No digital record, hard to search, no status visibility, staff must re-read it manually |
| Email to department | Unstructured, no deduplication, no way for other students to confirm they are affected too |

The fundamental gap is not a communication tool — it is accountability and visibility. Students don't know if anyone acted on their complaint. Staff don't know how many students are affected by a given issue.

### Why this is a real problem rather than an invented one

This is based on realistic observation of how college infrastructure complaints work in Indian engineering colleges. However, the specific severity of the problem at any given campus is an assumption that needs validation before building.

### How to validate it before building

Before writing a single line of code, do the following:

1. **Intercept survey (15–20 students, 5 min each):** Ask: "In the last month, did you notice a campus facility problem? Did you report it? What happened?" Collect responses in a spreadsheet.
2. **Admin side-interview (1–2 facility staff):** Ask how they currently receive complaints, how they track them, and whether they know which issues affect many students.
3. **Observation in WhatsApp groups:** Look at your own class/hostel WhatsApp groups. Count facility-related messages in the last 30 days. Note if any were followed up on.
4. **Threshold for proceeding:** If at least 10 out of 20 students recall a campus issue they did not formally report, and at least 1 admin confirms they lack structured tracking, the problem is real enough to build for.

> **What is known:** Informal complaint channels (WhatsApp, verbal) are the norm in most engineering colleges.  
> **What needs validation:** Whether students at this specific campus actually experience unresolved complaints frequently enough to use a dedicated tool.

---

## 3. Target Users

### Primary User — Student

**Profile:** Undergraduate B.Tech student (1st–4th year) at one engineering college. Uses classrooms, labs, hostel, library, and college canteen daily. Has a smartphone and basic web access. Is not motivated by civic duty alone — needs the tool to feel worth the 2 minutes it takes to file a complaint.

**Context:** On campus most weekdays. Encounters broken infrastructure regularly. Currently vents frustration in WhatsApp groups or ignores the problem.

**Main pain points:**
- No confidence that reporting a problem will do anything.
- No way to see if others have already reported the same problem.
- No visibility into whether an old issue was resolved.
- Reluctant to walk to an admin office for a "minor" issue.

### Secondary User — Administrator

**Profile:** College facility staff, hostel warden, lab technician, or department clerk responsible for assigning and resolving facility issues. Not necessarily tech-savvy; needs a clean, simple interface.

**Context:** Checks a dashboard periodically (not necessarily in real time). May manage issues across multiple locations (one hostel block, one department, etc.).

**Main pain points:**
- No structured way to receive, track, or prioritize complaints.
- No way to know how many students are affected by a given issue.
- No place to communicate resolution back to students.

---

## 4. User Stories

### Student Stories

**S1.** As a student, I want to register and log in with my college email and a password, so that my reports are linked to my identity and I can track them.

**S2.** As a student, I want to report a new campus issue with a title, description, category, location, and severity, so that the relevant staff can understand and act on it.

**S3.** As a student, I want to attach an optional photo to my report, so that the issue is clear without requiring the admin to visit immediately.

**S4.** As a student, I want to search and browse existing issues before reporting a new one, so that I can upvote an existing report instead of creating a duplicate.

**S5.** As a student, I want to upvote an existing issue to indicate that it affects me too, so that the issue's impact is visible to admins.

**S6.** As a student, I want to see the current status of an issue I reported or upvoted (Open / In Progress / Resolved), so that I know whether it is being handled.

**S7.** As a student, I want to view a detail page for any issue showing its description, location, category, current status, upvote count, and any admin remarks, so that I have full context.

### Administrator Stories

**A1.** As an admin, I want to log in with a separate admin account, so that I have access to management actions students cannot perform.

**A2.** As an admin, I want to see a dashboard of all reported issues sorted by impact score (descending), so that I can quickly identify the most critical problems.

**A3.** As an admin, I want to filter issues by category, location, status, or severity, so that I can focus on my area of responsibility.

**A4.** As an admin, I want to update the status of any issue (Open → In Progress → Resolved), so that students know their complaint was acted on.

**A5.** As an admin, I want to add a remark when updating an issue's status (e.g., "Electrician scheduled for Thursday"), so that students receive a concrete update.

**A6.** As an admin, I want to see the impact score and upvote count for each issue, so that I can justify prioritization decisions.

---

## 5. MVP Core Features

### Feature 1 — Student Registration and Login
**What it does:** Students register with a name, college email, and password. They log in to access report and upvote functionality. Logged-out users can browse and search issues but cannot report or upvote.  
**Why needed:** Without identity, duplicate upvotes are uncontrollable and spam is unmanageable.  
**MVP:** Yes.

### Feature 2 — Issue Reporting
**What it does:** A logged-in student submits a new issue with: title (required), description (required), category (dropdown), location (dropdown or short text field), severity (Low / Medium / High), and an optional image upload (stored locally, served statically).  
**Why needed:** Core creation flow without which nothing else exists.  
**MVP:** Yes.

### Feature 3 — Issue Listing, Search, and Filter
**What it does:** A public page lists all issues. Students can search by keyword (title/description) and filter by category, location, status, and severity. Issues are displayed with title, category, location, status badge, upvote count, and impact score.  
**Why needed:** Prevents duplicates; lets students confirm a problem already exists.  
**MVP:** Yes.

### Feature 4 — Upvoting
**What it does:** A logged-in student can upvote any issue that is not their own. One upvote per student per issue. The upvote count is visible on the listing and detail page. Clicking again removes the upvote (toggle).  
**Why needed:** Upvotes are the primary signal of how many students are affected, which drives prioritization.  
**MVP:** Yes.

### Feature 5 — Issue Detail Page
**What it does:** Shows full issue information: title, description, category, location, severity, reporter (display name), date submitted, status, upvote count, impact score, image (if any), and admin remarks (chronological).  
**Why needed:** Students and admins both need a single source of truth for each issue.  
**MVP:** Yes.

### Feature 6 — Status Tracking
**What it does:** Each issue has a status: Open (default), In Progress, Resolved. Status is visible everywhere (listing, detail). A student's profile page shows issues they reported and issues they upvoted, with current status.  
**Why needed:** Without status visibility, students have no reason to trust the system.  
**MVP:** Yes.

### Feature 7 — Admin Login and Dashboard
**What it does:** Admin accounts are created manually (seeded in the database or via a CLI command). Admins log in and see a dashboard of all issues sorted by impact score, with filter controls.  
**Why needed:** Admins need a structured view to manage issues without digging through a flat list.  
**MVP:** Yes.

### Feature 8 — Admin Status Update and Remarks
**What it does:** On any issue's detail page, an admin sees a status-update form. They can change status and optionally add a remark. Remarks are stored with a timestamp.  
**Why needed:** Closing the loop — students must see that something happened.  
**MVP:** Yes.

### Feature 9 — Impact Score Display
**What it does:** A computed score shown on every issue card and detail page. Drives default sort order on listing and admin dashboard. Formula defined in Section 7.  
**Why needed:** Gives students and admins a single number that summarizes priority without requiring them to mentally weigh multiple fields.  
**MVP:** Yes — display and sort only; no ML.

---

## 6. Core User Flow

### Student Flow

```
[Landing Page — Browse issues, search, filter]
        |
        | (not logged in)
        v
[Register / Login]
        |
        v
[Browse issues listing]
        |
        +---> [Find existing issue] ---> [Upvote it] ---> [Track status on profile]
        |
        +---> [No matching issue found] ---> [Report new issue form]
                    |
                    v
              [Issue created, status = Open]
                    |
                    v
              [Issue visible in listing, impact score computed]
                    |
                    v
              [Track status on profile page or issue detail page]
```

### Admin Flow

```
[Admin Login]
        |
        v
[Admin Dashboard — issues sorted by impact score, filterable]
        |
        v
[Select issue to review]
        |
        v
[Issue Detail Page]
        |
        v
[Update status (Open / In Progress / Resolved) + optional remark]
        |
        v
[Status visible to all students immediately]
```

---

## 7. Impact Score

### Formula

```
impact_score = (upvotes * 3) + (severity_weight * 5) + age_bonus
```

Where:

| Variable | Value |
|---|---|
| `upvotes` | Total number of upvotes the issue has received |
| `severity_weight` | Low = 1, Medium = 2, High = 3 |
| `age_bonus` | `min(days_open, 30)` — issues unresolved for up to 30 days get increasing urgency; capped to avoid ancient spam dominating forever |

### Why these weights

- Upvotes are the most important signal: an issue affecting 10 students is objectively more urgent than one affecting 1.
- Severity is a strong but reporter-supplied signal (can be over-reported), so it weighs slightly less per unit than confirmed upvotes.
- Age bonus prevents genuinely long-standing problems from being buried by fresh high-upvote reports.

### Concrete example

An issue reported 10 days ago with severity = High and 4 upvotes:

```
impact_score = (4 * 3) + (3 * 5) + min(10, 30)
             = 12 + 15 + 10
             = 37
```

A brand-new issue today with severity = Medium and 8 upvotes:

```
impact_score = (8 * 3) + (2 * 5) + min(0, 30)
             = 24 + 10 + 0
             = 34
```

The older, higher-severity, lower-upvote issue ranks slightly higher — reasonable in this case because 10 days unresolved plus high severity suggests a genuine problem.

> The score is recomputed on read (not stored) for MVP simplicity, since SQLite at this scale has no performance concern.

---

## 8. Out of Scope (MVP)

| Feature | Reason excluded |
|---|---|
| Mobile app (Android/iOS) | Increases build scope by 3–5×; responsive web is sufficient |
| Email notifications | Requires SMTP setup and email verification; adds complexity with low MVP return |
| Push notifications | Requires service workers or FCM; out of scope for beginner build |
| WhatsApp integration | Third-party API, credential management, ongoing cost |
| AI/ML duplicate detection | Overkill for MVP scale; browsing the list before reporting is sufficient |
| AI image analysis | Adds model dependency; not needed to understand a complaint |
| Automatic assignment of issues to staff | Requires org-chart data; too complex for MVP |
| Multi-college/multi-campus support | Scoping to one campus keeps auth, location, and admin roles simple |
| Comment threads | Adds complexity; admin remarks on the detail page are sufficient for MVP |
| Public social features (likes, sharing) | Not the right product for this; keep it internal |
| Analytics dashboard (charts, trends) | Useful post-MVP; sortable table is sufficient now |
| Complex role hierarchy | One student role + one admin role covers MVP needs |
| Payment or gamification | Not relevant to this problem |
| Automated status transitions | No workflow engine needed; manual admin updates are fine |

---

## 9. Success Metrics

### What "25 real users" means for this project

The program target of 25 users means 25 distinct students who:
- Have registered an account with a real email,
- Have performed at least one meaningful action (submitted an issue OR upvoted an existing issue), and
- Are not the developer or test accounts.

This is the minimum bar. The goal is not 25 passive sign-ups.

### Metrics

| Metric | Target for MVP milestone | Why it matters |
|---|---|---|
| Registered student accounts | ≥ 25 (non-test) | Meets program requirement |
| Students who submitted ≥ 1 issue | ≥ 10 | Proves the reporting flow is usable |
| Students who upvoted ≥ 1 issue | ≥ 15 | Proves the upvote flow is usable and students find value in confirming existing issues |
| Total issues submitted | ≥ 20 | Enough data for admin dashboard to be meaningful |
| Issues with ≥ 2 upvotes | ≥ 5 | Validates that duplicate prevention is working |
| Issues with admin status update | ≥ 3 | Validates the admin side is functional end-to-end |
| Students who return after first session | ≥ 30% (of registered) | Signals retention; students checked back for status updates |
| Students who say CampusFix helped them understand/report a problem | ≥ 70% (short survey, ≥ 10 respondents) | Direct user-value signal |

### How to collect these metrics at MVP scale

- Query the SQLite database directly (no analytics platform needed): count users, issues, upvotes, status-change events.
- Run a 3-question survey after 2 weeks of use: "Did you report or upvote an issue? Did you check back for status updates? Did CampusFix make it easier to report a problem?" (Yes/No + one optional line).

---

## 10. MVP Acceptance Criteria

The MVP can be considered functional when all of the following are true:

**Authentication**
- [ ] A new student can register with name, email, and password.
- [ ] A registered student can log in and log out.
- [ ] An admin can log in with seeded credentials.
- [ ] A logged-out user can browse and view issues but not report or upvote.

**Issue Reporting**
- [ ] A logged-in student can submit an issue with title, description, category, location, and severity.
- [ ] Optional image upload works and the image is displayed on the detail page.
- [ ] A newly submitted issue appears on the listing page within the same session.

**Listing, Search, Filter**
- [ ] All issues are visible on the main listing page.
- [ ] Keyword search filters issues by title and description.
- [ ] Filtering by category, location, status, and severity works correctly.
- [ ] Issues are sorted by impact score (descending) by default.

**Upvoting**
- [ ] A logged-in student can upvote an issue they did not report.
- [ ] The upvote count increments by exactly 1 per student.
- [ ] A student cannot upvote their own issue.
- [ ] Upvoting a second time removes the upvote (toggle).

**Issue Detail**
- [ ] The detail page shows all fields: title, description, category, location, severity, reporter name, date, upvote count, impact score, status, image, and admin remarks.

**Admin Dashboard**
- [ ] Admin can log in and view all issues sorted by impact score.
- [ ] Admin can filter by status, category, and severity.
- [ ] Admin can update the status of any issue.
- [ ] Admin can add a remark; the remark appears on the detail page with a timestamp.

**Profile / Status Tracking**
- [ ] A student can view a profile page listing their reported issues and upvoted issues with current statuses.

**Impact Score**
- [ ] Impact score is computed correctly per the formula in Section 7.
- [ ] Score updates when a new upvote is added or the issue ages.

---

## 11. Risks and Validation Plan

| Assumption | Risk if wrong | How to validate |
|---|---|---|
| Students will report issues if a tool exists | Low adoption; the real barrier may be fear of social consequences or skepticism that anything will happen | Pre-launch survey: "Would you use this if it existed?" + post-launch: track whether real issues are submitted in week 1 |
| Admins will check and update the dashboard | Without admin action, students lose trust and stop using the tool | Talk to 1–2 facility staff before building; confirm they want a structured tool and will commit to checking it at least twice a week |
| Students want to upvote rather than submit a duplicate | If upvote discoverability is low, duplicates accumulate | Watch for duplicate reports in the first 50 issues; if >20% look like duplicates, improve the search prominence |
| One campus is enough to reach 25 users | Small campus or low engagement may not yield 25 active users | Identify at least 30 willing participants (classmates, hostel-mates) before launch, not after |
| SQLite is sufficient for MVP scale | At very high concurrency, SQLite write-locking can cause errors | Acceptable risk at ≤ 100 concurrent users; migrate to PostgreSQL only if it becomes a problem post-MVP |
| Optional image upload will work reliably | File size limits, storage path issues | Test upload flow with 5 different images before calling it done; set a hard 2 MB limit client-side |
| Students will trust the system enough to use real names/emails | Anonymous use may be preferred | Consider whether a display-name-only option (with email kept private) addresses this; decide before launch |

---

## 12. Future Possibilities

These are intentionally excluded from MVP but are realistic next steps:

- **Email digest for admins:** Weekly email summarizing open high-impact issues — low complexity, high admin value.
- **Status change notifications for reporters:** Notify the student who filed an issue when its status changes.
- **Comment threads:** Students and admins can exchange clarifying questions on an issue.
- **Category-based admin roles:** Assign hostel issues to warden, lab issues to lab staff, etc.
- **Analytics dashboard:** Charts showing issues by category over time, average resolution time, most-affected locations.
- **CSV export:** Admin exports open issues as CSV for offline tracking or meetings.
- **Duplicate flagging (non-ML):** Students can suggest that an issue duplicates another one; admin confirms.
- **Multi-college expansion:** Separate issue spaces per campus behind sub-domains.

None of these belong in the MVP. They are documented here to prevent scope creep during development.

---

## MVP Feature Lock

> **This is the canonical feature list for CampusFix MVP.** It will be referenced verbatim in `ARCHITECTURE.md`, `API_SPEC.md`, `ROADMAP.md`, `REQUIREMENTS.md`, and `README.md`. Do not modify this list without explicit approval.

### Included in MVP

| # | Feature | Notes |
|---|---|---|
| F1 | Student registration and login | Email + password; session-based auth via Flask-Login |
| F2 | Admin login | Seeded credentials; separate role flag in users table |
| F3 | Issue reporting | Title, description, category, location, severity, optional image |
| F4 | Issue listing page | All issues, public (no login required to view) |
| F5 | Keyword search | Filter by keyword across title and description |
| F6 | Filter by category / location / status / severity | Applied client-side via query params |
| F7 | Upvoting | One upvote per student per issue; toggle; cannot upvote own issue |
| F8 | Issue detail page | Full fields + admin remarks + image |
| F9 | Impact score | Formula: (upvotes × 3) + (severity_weight × 5) + min(days_open, 30) |
| F10 | Default sort by impact score | On listing page and admin dashboard |
| F11 | Status tracking | Open / In Progress / Resolved; visible everywhere |
| F12 | Student profile page | My reported issues + my upvoted issues with statuses |
| F13 | Admin dashboard | All issues, filterable, sorted by impact score |
| F14 | Admin status update + remark | Status change form on detail page; remarks timestamped |

### Explicitly excluded from MVP

Email notifications, push notifications, WhatsApp integration, mobile app, ML/AI features, comment threads, multi-college support, analytics charts, role-based issue assignment, CSV export, public social features, payment, gamification.
