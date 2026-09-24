# Phoenixcoders
# CampusFix 🏫🛠️

A centralized web platform for reporting, tracking, and resolving campus infrastructure problems — built to replace scattered WhatsApp complaints with a transparent, data-driven system.

## Why We're Building This

Campus problems like broken fans, damaged benches, Wi-Fi outages, water leakage, unclean washrooms, and faulty lab equipment are a constant reality for students. Right now these issues get reported through:

- WhatsApp groups that scroll away and get forgotten
- Verbal complaints to wardens or staff with no paper trail
- Informal word-of-mouth that never reaches the right department

This makes it nearly impossible for college authorities to track what's broken, how many students are affected, or which problems actually need urgent attention. A leaking pipe reported by five different students in five different chats looks like five separate problems instead of one urgent one.

CampusFix fixes this by giving every reported issue a single home: one record, one status, one score that reflects how much it matters.

## What Students Can Do

- Report a new issue with its location, category, description, and an optional photo
- Report an issue by speaking instead of typing, in their preferred language
- Have the issue read back aloud before submitting, to confirm details are correct
- View existing reported issues before filing a new one
- Upvote problems that affect them instead of creating duplicates
- Track the status of any issue they reported or upvoted
- Receive updates when an issue moves to "In Progress" or "Resolved," including spoken alerts

## What Administrators Can Do

- View all reported issues from a single dashboard
- Identify duplicate or similar complaints automatically
- Prioritize issues based on severity and number of students affected
- Update the status of any issue
- Track unresolved and resolved problems over time

## Key Feature: Impact Score

Not every problem deserves the same urgency. CampusFix calculates an Impact Score for each reported issue using:

- Number of students affected (upvotes)
- Severity of the problem
- How long the issue has remained unresolved

The higher the score, the more attention the issue needs. This turns a noisy pile of complaints into a ranked, actionable list for administrators.

## Key Feature: Multilingual Voice Reporting

Not every student is comfortable typing out a detailed complaint, especially in English. CampusFix supports voice-based reporting so students can:

- Speak their complaint aloud, and have it converted to text using speech-to-text
- Choose their preferred language from a language selector (e.g. English, Hindi, Bengali, and other regional languages)
- Hear the filled-in report read back to them before submitting, to confirm nothing was misheard
- Receive status updates and notifications as spoken audio, not just on-screen text

This makes reporting accessible to a wider range of students, including those who are more comfortable speaking than typing, or who use the platform on the go without wanting to type on a small screen.

## Example Walkthrough

A student reports:

```text
Problem: Wi-Fi not working
Location: IT Department, Room 204
Severity: High
```

Other students facing the same problem upvote the existing report instead of filing duplicates. Within a day, the administrator dashboard shows:

```text
Wi-Fi Problem — Room 204
37 students affected
Priority: High
Status: In Progress
```

Once the issue is fixed, the administrator marks it "Resolved," and the students who reported or upvoted it can verify the fix and see it reflected in their own tracking view.

## Technology Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Python (Flask or FastAPI)
- Database: SQLite
- Voice Input: Browser Web Speech API (speech-to-text) with language selection
- Voice Output: Text-to-speech engine for read-back and spoken notifications
- Translation: Language detection and translation layer to normalize spoken input into a consistent format before saving
- Optional: Chart.js for statistics and admin dashboard visualizations

## How It Works (End to End)

1. Student reports a problem with location, category, description, and an optional photo — either by typing or by speaking in their preferred language.
2. If spoken, the report is converted to text, translated if needed, and read back for the student to confirm before submitting.
3. Other students upvote the existing report if they face the same issue.
4. The system calculates the Impact Score from upvotes, severity, and time open.
5. Administrator reviews issues on the dashboard, sorted by Impact Score.
6. Administrator updates the issue status as it moves toward resolution.
7. Students track the resolution and confirm once it's fixed, receiving spoken alerts if voice notifications are enabled.

## Main Objective

CampusFix aims to make campus problem reporting centralized, transparent, trackable, and data-driven — helping students communicate problems effectively, in the language and mode most comfortable to them, and helping authorities resolve them faster and in the right order of priority.

## Project Structure

```text
CampusFix/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── routes/
│   └── services/
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── css/
│   └── js/
├── uploads/
├── requirements.txt
└── README.md
```

## Status

Active development.
