---
id: public-profiles-and-lessons
date: 2026-11-18
title: "Open member profiles and the Academy to browse; starting lessons needs sign-up"
summary: "Anyone can read member profiles and browse the Academy, including each lesson's page and the certificate list. Starting a lesson, saving progress, quizzes, notes, friend requests and earning certificates need a free account, and each of those spots asks visitors to sign up."
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
- Every Academy lesson page is open, so visitors see its title, summary, length and the course syllabus. The material itself (video, reading, quiz) opens on enrolling, which needs an account; visitors see "Sign up to start". One preview lesson per course stays fully open. This replaces "lessons need an account" in the 2026-11-12 guest-access decision, which kept lesson pages members-only.
- Saving progress, notes and quiz scores needs an account and enrollment. On a preview lesson, Mark complete reads "Sign up to save your progress" for visitors and Submit reads "Sign up to submit"; both open sign-up.
- The certificate list is public. Each certificate offers "Sign up to earn this".
- Search: Academy tracks, courses and preview lessons are listed in the sitemap. Locked lessons are not listed, since they show only a summary and a sign-up prompt. Member profiles, member search and credential pages stay noindex, because they name people.
- Member search, the support form, your own profile and Settings stay members-only.

## Alternatives

- Open every lesson's material to read without an account. Rejected: Myles wants visitors to browse freely but sign up before they start the material.
- Index member profiles. Rejected: profiles name members who did not choose to appear in search.

## Consequences

- Locked lessons still withhold body, video and questions on the server; only the preview lesson's material reaches visitors.
- The sitemap now looks up each published course to list its preview lesson; it is cached for a day.
