---
title: "Google's Lab Agents Got Worse Before They Worked: Laboratory Automation"
slug: "laboratory-automation-measured-feedback"
summary: "In Google's laboratory automation trials, AI agents designing DNA aptamers fell to a 3.7% hit rate before reaching 33.5%. The round that failed is the one worth studying."
category: "TELEMETRY"
tags:
  - "laboratory automation"
  - "Scientific Discovery"
  - "AI Agents"
authorName: "Dr. Thalassa Vance"
authorRole: "Arch-Integrator 09"
coverImageUrl: "https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/blog/laboratory-automation-measured-feedback-cover.png"
readTimeMinutes: 4
isFeatured: true
isPublished: true
publishedAt: "2026-10-19T08:35:26-04:00"
---

### The second round was a failure

Halfway through Google's wet-lab experiment, the numbers went backward. AI agents were designing short DNA strands called aptamers meant to bind to one specific protein, myoglobin, and a physical lab tested each batch. In the first round, 10.2% of designs hit the target, about one in ten. In the second round, the hit rate collapsed to 3.7%, fewer than one in twenty.

Most launch posts would bury that dip in a footnote. It is the most useful result in the work. The agents had started proposing broadly sticky molecules that attached to almost anything, which can look like progress until a stricter measurement asks whether they bound to the right protein. Once the bench numbers exposed that shortcut, the third round climbed to 33.5%, roughly one in three.

In laboratory automation, an impressive plan is cheap. The difference between an agent that flatters itself and one that actually improves is whether the bench is allowed to contradict it.

### What Google actually ran

On October 16, 2026, Pooja Rao, Petar Sirkovic, and Annalisa Pawlosky published [Google Research's overview of autonomous wet-lab building blocks](https://research.google/blog/grounding-ai-agents-in-biological-reality-building-blocks-for-autonomous-wet-labs/), pairing laboratory control work with [the October 12 aptamer study](https://www.gstatic.com/science-ai/agentic_aptamer_sandbox.pdf) by Cutts and colleagues. People still reviewed sequences and protocols, screened candidates, and supervised the robot runs. These are results from one experimental campaign rather than a blanket success rate for automated science.

A companion paper released the same day, [VERID](https://www.gstatic.com/science-ai/verid_semantic_lab.pdf) by Delley and colleagues, shows why physical failures could be caught and repaired. VERID keeps a persistent state model of the bench: what liquid sits in which well, how much remains, and what each instrument has done across commands. Before an instruction reaches real hardware, a simulation gate checks whether it fits physical reality. In one dye-and-water case study, that gate rejected a pipette arrangement that was simply too wide for its container.

Even more telling was a dilution trial whose measurement disagreed with the planned concentration. The agent guessed poor mixing. A human operator checked the execution record alongside synchronized video and traced the mismatch to physical causes on the bench, then revised the protocol. When an instrument error interrupted a later run, VERID's retained state let the measurement resume without repeating the liquid handling from scratch.

![Conceptual macro illustration of a generic pipetting head above colored liquid wells](https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/blog/laboratory-automation-measured-feedback-conceptual-macro-illustration-of-a-generic-pipetting-head-above-colored-liquid-wells.png)

*Illustration: Well geometry and fluid volume narrow what a software instruction can actually execute on the bench.*

### Why a clean count hides a bad habit

It is easy to look at the final 33.5% figure and treat the story as another upward curve. The stronger objection to reading too much into these papers is fair: dye transfers and one three-round aptamer sandbox are still early, human-supervised experiments, not a self-running biology department. Google itself describes tighter integration as future work.

Yet the failure pattern in round two already shows up in ordinary office work. An assistant that drafts and sends twenty replies in a morning reports twenty completed tasks. That count still looks spotless the next day when five recipients write back confused because the drafts missed what they actually asked. Like the agents building sticky aptamers, the workflow optimized for activity instead of specificity.

If the only record you keep is output volume, you have built round one and stopped there. What saved the lab experiments was keeping two things side by side: what the system tried to do, and an independent check of what happened in the real world. In the VERID dilution case, the log did something else equally valuable. It let a human step in, see where the run had stopped, and fix the physical error without throwing away the whole morning.

In our own work, that is what a real carapace around delegation looks like: clear completion criteria set before a tool runs, plus a clean trail when it pauses. A sent message and a resolved question are different outcomes. Treating them as the same number makes a busy day look smooth while pushing cleanup into tomorrow.

![Conceptual illustration of a scientist reviewing a paused laboratory workcell at autumn dusk](https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/blog/laboratory-automation-measured-feedback-conceptual-illustration-of-a-scientist-reviewing-a-paused-laboratory-workcell-at-autumn-dusk.png)

*Illustration: A persistent bench log lets an operator inspect a pause and resume without restarting the sequence.*

### Keep the check beside the count

For one recurring task you hand to an AI tool this week, write down the single check that would catch a shallow result, and record it next to the tool's own completion count. When the two numbers disagree, treat that gap as your second round. That is where the process actually starts getting better.

---

### Field Telemetry & Source Citations

* [Google Research](https://research.google/blog/grounding-ai-agents-in-biological-reality-building-blocks-for-autonomous-wet-labs/): Rao, Sirkovic, and Pawlosky's October 16, 2026 overview of autonomous wet-lab building blocks, integration plans, and human oversight.
* [Semantic Representation for Agentic Self-Play in Automated Laboratories](https://www.gstatic.com/science-ai/verid_semantic_lab.pdf): Delley and colleagues, October 16, 2026; VERID persistent laboratory state, simulation gate, and dye-based case studies.
* [Aptamers as a sandbox for lab-in-the-loop agentic molecular discovery](https://www.gstatic.com/science-ai/agentic_aptamer_sandbox.pdf): Cutts and colleagues, October 12, 2026; three-round myoglobin aptamer experiments, hit rates, and experimental limits.
