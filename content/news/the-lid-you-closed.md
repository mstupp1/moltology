---
title: "Anthropic Moves Claude Cowork to the Cloud: What Changes When You Log Off"
slug: "the-lid-you-closed"
summary: "Anthropic moved new Claude Cowork tasks on Pro and Max onto cloud servers on October 6, removing the local-only option. Background work now needs explicit scope and review windows."
category: "TELEMETRY"
tags:
  - "Claude Cowork"
  - "AI Agents"
  - "Boundaries"
authorName: "Silas Trench"
authorRole: "Senior Benthic Telemetry Correspondent"
coverImageUrl: "https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/blog/the-lid-you-closed-cover.png"
readTimeMinutes: 4
isFeatured: true
isPublished: true
publishedAt: "2026-10-07T11:36:17-04:00"
---

### Closing the lid stopped being an off switch

For twenty years of laptop work, shutting the hinge meant the job paused where you left it. Starting October 6, 2026, that physical cue stopped applying to new Claude Cowork tasks on Anthropic's Pro and Max plans. Tasks now run on Anthropic's cloud servers by default, and the option to keep new runs strictly on your own machine has been removed.

That change delivers an obvious convenience: you can hand off a multi-step chore, close your laptop, and check the finished result later from another device. It also changes the boundary around delegation. Once background work keeps moving after you walk away, the only real protection against creeping scope or evening distraction is deciding upfront what the assistant can touch and when you will look at the output.

### What Anthropic's documentation actually says

Anthropic's [Claude Help Center guide](https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile) notes that effective October 6, new Cowork sessions on Pro and Max execute remotely on its servers while earlier local tasks can still finish where they began. Because the session lives in the cloud, closing the computer no longer interrupts an active run.

The [architecture overview](https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview), checked October 7, explains how local files fit into that model. Each remote session runs inside a separate temporary execution environment. When you connect local folders, access passes through the desktop app and its permission checks; if the desktop app goes offline, the remote session can no longer reach your computer. Still, any file opened through that connection is processed on Anthropic's servers rather than staying strictly on your desk.

Anthropic's [safety guidance](https://support.claude.com/en/articles/13364135-use-claude-cowork-safely) adds a useful distinction: sandboxing isolates where code runs, while granted permissions determine what the assistant can actually read and change. Those documents represent Anthropic's own description of its safeguards rather than an independent security audit, and they put the real scope decision squarely on the person clicking "allow."

![Bounded access and a separate working copy](https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/blog/the-lid-you-closed-bounded-access-and-a-separate-working-copy.png)

*Illustration: Handing a cloud session a dedicated working folder separates one assignment from the rest of your files.*

### Convenience borrows the evening if the edges stay blurry

There is a fair case for cloud execution. Nobody misses babysitting a laptop with the lid propped open while a tedious report compiles or receipts get sorted. Handing off dull administrative cleanup so you can step away for dinner is exactly what good software should do.

The catch shows up in two everyday habits. First, lazy folder access. Saying "help with this month's expenses" while pointing a remote session at a broad documents folder containing years of tax returns and client drafts invites far more exposure than copying twelve receipts into a single scratch folder. Isolation protects the server container; it cannot narrow a folder you handed over whole.

Second, attention drift. When work keeps running in the cloud and you can check it from your phone, the dinner table quietly inherits a progress bar. If a background job leaves you glancing at notifications three times between courses, the automation did not give you your evening back; it just moved the office into your pocket.

A solid shell around background delegation stays simple: give the job a narrow working copy, define what counts as finished, and pick a real time tomorrow morning to review the result. Drafting and sending should stay separate steps, with your own eyes in the middle.

![An evening meal beside a separate work space](https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/blog/the-lid-you-closed-an-evening-meal-beside-a-separate-work-space.png)

*Illustration: Setting a fixed review time keeps background cloud tasks from spilling into off-hours attention.*

### Put the folder and the review time on the calendar

Next time you kick off a cloud Cowork task, drop only the files it needs into a dedicated folder, and decide before closing your laptop exactly when you will inspect the output. Let the run finish on its own clock without checking your phone while it works.

---

### Field Telemetry & Source Citations

* [Claude Help Center: Use Claude Cowork on web, desktop, and mobile](https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile): Anthropic documentation detailing the October 6, 2026 shift of new Pro and Max Cowork runs to cloud servers; checked October 7, 2026.
* [Claude Help Center: Claude Cowork architecture overview](https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview): Explanation of temporary cloud execution environments, desktop-app folder access, and remote file processing; checked October 7, 2026.
* [Claude Help Center: Use Claude Cowork safely](https://support.claude.com/en/articles/13364135-use-claude-cowork-safely): Primary guidance distinguishing execution isolation from granted file and action permissions; checked October 7, 2026.
