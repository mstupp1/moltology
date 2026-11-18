---
id: public-profiles-and-lessons
date: 2026-11-18
title: "Open member profiles and Academy lessons to signed-out visitors"
summary: "Anyone can read member profiles, every Academy lesson and the certificate list. Saving progress, quizzes, notes, friend requests and earning certificates still need a free account, and each of those spots asks visitors to sign up."
domains: [data]
rules: [data.member-share-previews]
status: accepted
sources:
  - doc: src/lib/server/db-services.ts
  - doc: src/lib/academy.ts
  - doc: src/components/academy/AcademyLessonView.tsx
  - doc: src/lib/server/document-feeds.ts
---

## Context

Shared profile links failed for signed-out visitors with "Authentication required", because the profile and loadout lookups demanded a session even though the page is meant to be public. The guest-access decision of 2026-11-12 had also kept Academy lessons and the certificate list behind an account, so most course content was invisible to search and to anyone following a shared link. Signup from guests is the main growth bottleneck.

## Decision

- Member profiles are public: name, stage, avatar, join date, Moltmax rating, bio, traits, bonds and equipped gear. Signed-out visitors see "Sign up to add friend" and "Build your own" (the guest character editor) instead of friend actions.
- Every Academy lesson is readable without an account or enrollment. This supersedes "lessons need an account" in the 2026-11-12 guest-access decision.
- Saving progress, notes and quiz scores still needs an account and enrollment. For visitors, Mark complete reads "Sign up to save your progress" and Submit reads "Sign up to submit"; both open sign-up.
- The certificate list is public. Each certificate offers "Sign up to earn this".
- Search: Academy tracks, courses and lessons are indexed and listed in the sitemap. Member profiles, member search and credential pages stay noindex, because they name people.
- Member search, the support form, your own profile and Settings stay members-only.

## Alternatives

- Keep lessons behind enrollment with one preview lesson per course. Rejected: the preview gave search and visitors too little to judge a course by.
- Index member profiles. Rejected: profiles name members who did not choose to appear in search.

## Consequences

- Lesson bodies and quiz questions are sent to anyone. Quiz answers are still graded on the server and only recorded for signed-in learners.
- The sitemap now looks up each published course to list its lessons; it is cached for a day.
