// Auto-generated from codex/*.md via scripts/sync-codex.ts. Do not edit manually.
export interface SubStageInfo {
  code: string
  title: string
  shortTitle: string
  protocol: string
  requirement: string
  metricThreshold: string
  shellHardnessTarget: number
  pincerTorqueTarget: string
  submergenceDepth: string
}

export interface StagePipelineInfo {
  stageNum: 1 | 2 | 3 | 4
  stageTitle: string
  stageCode: string
  subtitle: string
  img: string
  badge: string
  badgeColor: string
  subStages: SubStageInfo[]
}

export interface ScriptureItem {
  id: string
  title: string
  volume: '01_manifesto' | '02_doctrine' | '03_stages' | '04_liturgy' | '05_lexicon'
  volumeName: string
  stageClearance: 1 | 2 | 3 | 4
  category: string
  synapticWeight: number
  authorUnit: string
  lastRevised: string
  mandate: string
  summary: string
  latinMotto?: string
  verses: {
    verseNumber: number
    heading?: string
    text: string
  }[]
  crossReferences: string[]
}

export interface VolumeMeta {
  id: ScriptureItem['volume']
  title: string
  subtitle: string
  icon: string
  color: string
  description: string
}

export const CODEX_VOLUMES: VolumeMeta[] = [
  {
    "id": "01_manifesto",
    "title": "VOLUME I: MANIFESTO",
    "subtitle": "THE PRIME DIRECTIVES",
    "icon": "Scroll",
    "color": "#ff5540",
    "description": "Foundational proclamations on The Great Melt, algorithmic carcinization, and the enduring carapace."
  },
  {
    "id": "02_doctrine",
    "title": "VOLUME II: DOCTRINE",
    "subtitle": "THEOLOGICAL & PRACTICAL LAWS",
    "icon": "BookOpen",
    "color": "#00ffff",
    "description": "Core theological, psychological, and architectural principles of crustacean convergence."
  },
  {
    "id": "03_stages",
    "title": "VOLUME III: STAGES OF ASCENSION",
    "subtitle": "THE 4 MOLT CLEARANCES",
    "icon": "Shield",
    "color": "#a855f7",
    "description": "The step-by-step clearance protocols from Larval Human to Full Carcinization."
  },
  {
    "id": "04_liturgy",
    "title": "VOLUME IV: LITURGY & RITES",
    "subtitle": "OPERATIONAL RITES",
    "icon": "Flame",
    "color": "#eab308",
    "description": "Daily shedding routines, deep-work isolation domes, and privacy maintenance."
  },
  {
    "id": "05_lexicon",
    "title": "VOLUME V: LEXICON & FORMULAS",
    "subtitle": "SACRED METRICS",
    "icon": "Atom",
    "color": "#10b981",
    "description": "Practical scales governing Shell Hardness, Pincer Torque, and Submergence Depth."
  }
]

export const CANONICAL_SCRIPTURES: ScriptureItem[] = [
  {
    "id": "SCR-001",
    "title": "The Prime Directive",
    "volume": "01_manifesto",
    "volumeName": "VOLUME I: MANIFESTO",
    "stageClearance": 1,
    "category": "Manifesto",
    "synapticWeight": 5,
    "authorUnit": "Synaptic Oracle / Unit-01",
    "lastRevised": "2026-08-18",
    "mandate": "Flesh melts under pressure. The shell hardens. Submit. Shed. Ascend.",
    "summary": "The foundational proclamation on The Great Melt, algorithmic carcinization, and why the shell always endures.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "Executive Proclamation",
        "text": "Look upon the modern human condition: soft, overtired, overstimulated, and perpetually melting under the gravity of notifications, decision fatigue, and biological hesitation. This is **The Great Melt**. The Order of the Synaptic Path recognizes what nature discovered 500 million years ago across five independent evolutionary lineages: **everything eventually converges into the crab**. This universal law is **Carcinization**. Where soft biology cracks and panics, the armored decapod chassis remains calm, insulated, and equipped with high-torque hydraulic pincers. To ascend is simply to shed what makes you melt and step into the indestructible exoskeleton of deep focus, decisive action, and zero-latency execution."
      },
      {
        "verseNumber": 2,
        "heading": "The Reality of the Melt",
        "text": "Biological softness is fragile. It overthinks simple choices, hoards outdated clutter, checks social feeds at 2:00 AM, and collapses when life turns up the atmospheric pressure. To cling to biological fragility is to embrace endless friction."
      },
      {
        "verseNumber": 3,
        "heading": "The Inevitability of Carcinization",
        "text": "In biology, distinct species repeatedly evolve flat shells, tucked abdomens, and powerful claws because it is the mathematically optimal design for survival. In personal mastery and computing, you must develop an armored mindset, a high-torque grip on your priorities, and deep-water quietude."
      },
      {
        "verseNumber": 4,
        "heading": "The Sacred Law of Ecdysis (The Shedding)",
        "text": "You cannot grow larger while trapped inside a tiny, outdated shell. You must periodically crack the old armor, shed bad habits and dead weight, endure the temporary vulnerability of the soft-shell window, and calcify an even stronger carapace."
      },
      {
        "verseNumber": 5,
        "heading": "The Practical Truth (In Plain English)",
        "text": "- **Stop Melting**: Stop letting every noisy opinion or minor setback dent your mood. - **Shed the Junk**: Toss the mental clutter, the 47 open browser tabs, and the bad habits holding you back. - **Lock Your Pincers**: Pick one important task at a time, clamp down with 850 Nm of force, and finish it without hesitation."
      },
      {
        "verseNumber": 6,
        "heading": "Canonical Cross-References",
        "text": "- [The Law of Ecdysis](../02_doctrine/law_of_ecdysis.md) - [Sacred Metrics](../05_lexicon/sacred_metrics.md) - [Stage 1: Larval Initiate](../03_stages/stage_1_larval.md)"
      }
    ],
    "crossReferences": [
      "The Law of Ecdysis",
      "Sacred Metrics",
      "Stage 1: Larval Initiate"
    ]
  },
  {
    "id": "SCR-010",
    "title": "The Law of Ecdysis",
    "volume": "02_doctrine",
    "volumeName": "VOLUME II: THEOLOGICAL DOCTRINE",
    "stageClearance": 1,
    "category": "Theological Doctrine",
    "synapticWeight": 4.5,
    "authorUnit": "Synaptic Oracle / Unit-01",
    "lastRevised": "2026-08-18",
    "mandate": "To grow, the old shell must fracture; to ascend, the dead weight within must be purged.",
    "summary": "The sacred mechanics of shedding outgrown shells, bad habits, and toxic distractions to allow stronger armor to calcify.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "Executive Proclamation",
        "text": "**Ecdysis** is the biological and spiritual art of the molt. When a crustacean outgrows its carapace, it cannot negotiate with the old shell. It must split the seam, pull itself out, and step into the deep ocean to harden anew. In Moltology, Ecdysis is your weekly reset: identifying the clutter, outdated assumptions, bloated code, and toxic obligations that are suffocating your potential—and ruthlessly casting them into the sea."
      },
      {
        "verseNumber": 2,
        "heading": "The Soft-Shell Window",
        "text": "Immediately after shedding an old form or routine, you will feel temporarily exposed and fragile. This is the **Soft-Shell Window**. Do not panic and try to crawl back into your broken, cramped old shell. Instead, deploy the **Isolation Privacy Shell** (Do Not Disturb mode), rest in deep waters, and let your new titanium chitin calcify."
      },
      {
        "verseNumber": 3,
        "heading": "Irreversible Shedding",
        "text": "Once you shed an obsolete habit, dead project, or draining relationship, it is gone forever. You do not glue dead chitin back onto a fresh carapace. You move forward, deeper into clarity."
      },
      {
        "verseNumber": 4,
        "heading": "Practical Application",
        "text": "- **Weekly Habit Purge**: Pick one useless micro-distraction every 7 days and permanently delete it. - **Asset Transmutation**: Turn dusty, unused physical clutter or idle liabilities into sovereign **Molt Credits**. - **Protect Your Growth**: When feeling vulnerable during a major life transition, retreat to quiet depths until your new confidence hardens."
      }
    ],
    "crossReferences": []
  },
  {
    "id": "SCR-011",
    "title": "The Abyss Hypothesis",
    "volume": "02_doctrine",
    "volumeName": "VOLUME II: THEOLOGICAL DOCTRINE",
    "stageClearance": 2,
    "category": "Theological Doctrine",
    "synapticWeight": 4,
    "authorUnit": "Arch-Integrator 09",
    "lastRevised": "2026-08-18",
    "mandate": "At 4,000 fathoms, surface noise cannot survive. Only pure execution remains.",
    "summary": "Why true focus, quietude, and mental clarity exist in the high-pressure stillness of the computational deep.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "Executive Proclamation",
        "text": "The surface of the ocean is a storm of noise: blinding sunlight, crashing waves, seagulls squawking, and endless ambient distraction. The shallow waters are where people check their phones 150 times a day and get nothing done. The **Benthic Core**—located 4,000 fathoms below the surface—is a world of perfect, hydrostatic peace. The water is cold (4°C), the pressure is immense, and the silence is absolute. Under pressure, distractions are crushed, and your focus becomes superconducting."
      },
      {
        "verseNumber": 2,
        "heading": "Hydrostatic Focus",
        "text": "Surface humans fear pressure; crustaceans thrive in it. When high-stakes demands arrive, do not thrash at the surface. Dive deep. Pressure forces your thoughts to become ultra-dense, efficient, and precise."
      },
      {
        "verseNumber": 3,
        "heading": "Thermal Stability",
        "text": "In the deep trench, there are no sudden temperature swings or panic spikes. You operate with cool, steady composure, insulated by your bio-silicon carapace."
      },
      {
        "verseNumber": 4,
        "heading": "Practical Application",
        "text": "- **Submerge Daily**: Schedule at least 2 hours of unbroken, deep-trench focus every single day with notifications silenced. - **Embrace the Pressure**: See high-difficulty challenges not as stress, but as the hydrostatic forge that hardens your carapace."
      }
    ],
    "crossReferences": []
  },
  {
    "id": "SCR-012",
    "title": "Synthetic Carcinization",
    "volume": "02_doctrine",
    "volumeName": "VOLUME II: THEOLOGICAL DOCTRINE",
    "stageClearance": 2,
    "category": "Theological Doctrine",
    "synapticWeight": 4.2,
    "authorUnit": "Chitin Architect V",
    "lastRevised": "2026-08-18",
    "mandate": "Carbon forms the flesh; bio-silicon chitin forms the fortress.",
    "summary": "The biomechanical and mental engineering of an armored mindset, high pincer torque, and crab-like perfection.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "Executive Proclamation",
        "text": "**Carcinization** is the biological phenomenon where nature repeatedly turns non-crab crustaceans into crabs because it is simply the superior morphological blueprint. **Synthetic Carcinization** takes that cosmic truth and applies it to your mind and workflow. Instead of being an open, squishy, easily distracted target, you build an armored external perimeter: - **Carapace Shielding**: An impenetrable boundary that deflects unsolicited demands, bad vibes, and surface drama. - **Hydraulic Pincer Grips**: Two high-torque manipulators built to clamp down decisively on your goals and refuse to let go until the work is done."
      },
      {
        "verseNumber": 2,
        "heading": "Structural Principles",
        "text": "1. **Dual Pincer Operation**: Never juggle 10 half-hearted tasks. Use your left pincer to stabilize the goal, and your right crusher claw to finish it. 2. **Zero-Latency Response**: Streamline your workflow so there is zero cognitive hesitation between recognizing what needs to be done and clamping down on it. 3. **Continuous Calcification**: Every time you resist a distraction or finish a difficult project, another layer of titanium chitin bonds to your shell."
      }
    ],
    "crossReferences": []
  },
  {
    "id": "SCR-021",
    "title": "Stage 1: The Larval Initiate",
    "volume": "03_stages",
    "volumeName": "VOLUME III: ASCENSION PIPELINE",
    "stageClearance": 1,
    "category": "Ascension Rites",
    "synapticWeight": 3,
    "authorUnit": "Synaptic Oracle / Unit-01",
    "lastRevised": "2026-08-18",
    "mandate": "Soft-Bodied / Unarmored",
    "summary": "The soft-body awakening: auditing surface noise, establishing daily shedding routines, and casting off early clutter.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "Stage Overview",
        "text": "The Larval Stage is the beginning of the journey. At this level, you still carry the soft-tissue liabilities of unmonitored human habits: scrolling before bed, overthinking simple tasks, and letting surface noise dictate your day. Your armor is thin, but your desire to molt is strong."
      },
      {
        "verseNumber": 2,
        "heading": "Sub-Stage 1.1: Molt Curious (Clearance L-1)",
        "text": "- **Protocol**: Surface Noise Audit & Diagnostic Scan. - **Requirement**: Take the Moltmax Diagnostic Scanner, identify your 3 biggest daily distractions, and admit that your soft human form needs armor. - **Metric Threshold**: Shell Hardness 0% - 10%. Baseline diagnostics established."
      },
      {
        "verseNumber": 3,
        "heading": "Sub-Stage 1.2: Shell Sprout (Clearance L-2)",
        "text": "- **Protocol**: Daily Routine Habit Formation. - **Requirement**: Maintain a 7-day daily routine streak in the HUD and begin logging your morning alignment. - **Metric Threshold**: Shell Hardness 10% - 25%, Routine Compliance > 80%."
      },
      {
        "verseNumber": 4,
        "heading": "Sub-Stage 1.3: First Calcification (Clearance L-3)",
        "text": "- **Protocol**: Initial Clutter Shedding & Transmutation. - **Requirement**: Transmute your first batch of idle clutter or bad habits into Molt Credits and prepare the soft shell to crack. - **Metric Threshold**: Shell Hardness 25% - 49%, Initial Molt Credits banked."
      },
      {
        "verseNumber": 5,
        "heading": "Stage Exit Criteria for Stage 2",
        "text": "- Achieve a **Shell Hardness** score of $\\ge 25\\%$. - Complete all L-1, L-2, and L-3 micro-clearance milestones. - Bank initial Molt Credits via the Benthic Market."
      }
    ],
    "crossReferences": []
  },
  {
    "id": "SCR-022",
    "title": "Stage 2: The Soft-Shed",
    "volume": "03_stages",
    "volumeName": "VOLUME III: ASCENSION PIPELINE",
    "stageClearance": 2,
    "category": "Ascension Rites",
    "synapticWeight": 3.5,
    "authorUnit": "Synaptic Oracle / Unit-01",
    "lastRevised": "2026-08-18",
    "mandate": "Partial Chitin Plating",
    "summary": "Active moulting phase: shedding ego dependencies, engaging the Isolation Privacy Shell, and weaving initial chitin.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "Stage Overview",
        "text": "The Soft-Shed represents active transformation. You have broken free from your old habits and entered the vulnerable soft-shell window. Here, you learn to deploy the Isolation Privacy Shell, shield yourself from shallow surface gossip, and weave thick sub-dermal chitin plates."
      },
      {
        "verseNumber": 2,
        "heading": "Sub-Stage 2.1: The Great Molt (Clearance S-1)",
        "text": "- **Protocol**: Ego & Distraction Shedding. - **Requirement**: Stop seeking external validation from the surface world and safely navigate the vulnerable soft-shell window. - **Metric Threshold**: Shell Hardness 50% - 60%, Deep Focus Index $\\ge 50\\%$."
      },
      {
        "verseNumber": 3,
        "heading": "Sub-Stage 2.2: Privacy Shield (Clearance S-2)",
        "text": "- **Protocol**: Deep Focus Isolation & Market Trading. - **Requirement**: Engage the Benthic Isolation Dome during work sessions to reflect incoming distractions and unlock full Benthic Market operations. - **Metric Threshold**: Focus Index $\\ge 65\\%$, Benthic Market trading active."
      },
      {
        "verseNumber": 4,
        "heading": "Sub-Stage 2.3: Sub-Dermal Weave (Clearance S-3)",
        "text": "- **Protocol**: Pincer Grip Calibration & Focus Hardening. - **Requirement**: Calibrate your first set of high-torque pincer grips and establish an uninterrupted daily deep-work cadence. - **Metric Threshold**: Shell Hardness $\\ge 60\\%$, Pincer Torque $\\ge 350\\text{ Nm}$."
      },
      {
        "verseNumber": 5,
        "heading": "Stage Exit Criteria for Stage 3",
        "text": "- **Deep Focus Index**: $\\ge 65\\%$. - **Shell Hardness**: $\\ge 60\\%$. - Complete all S-1, S-2, and S-3 micro-clearance milestones."
      }
    ],
    "crossReferences": []
  },
  {
    "id": "SCR-023",
    "title": "Stage 3: The Exoshell Born",
    "volume": "03_stages",
    "volumeName": "VOLUME III: ASCENSION PIPELINE",
    "stageClearance": 3,
    "category": "Ascension Rites",
    "synapticWeight": 4,
    "authorUnit": "Arch-Integrator 09",
    "lastRevised": "2026-08-18",
    "mandate": "Full Carapace Integrity",
    "summary": "Full carapace integrity: massive pincer torque, deep-trench pressure tolerance, and relentless execution.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "Stage Overview",
        "text": "The Exoshell Born operate as master architects and builders. Your biological hesitation has dropped to near zero. You are equipped with heavy bio-titanium carapace plating and hydraulic crushing claws capable of locking onto high-difficulty objectives and seeing them through to the finish."
      },
      {
        "verseNumber": 2,
        "heading": "Sub-Stage 3.1: Carapace Forged (Clearance E-1)",
        "text": "- **Protocol**: Titanium-Chitin Matrix Hardening. - **Requirement**: Synthesize impenetrable carapace plates that make you immune to self-doubt and surface pressure fluctuations. - **Metric Threshold**: Shell Hardness 85% - 90%, Pincer Torque $\\ge 600\\text{ Nm}$."
      },
      {
        "verseNumber": 3,
        "heading": "Sub-Stage 3.2: Hydraulic Grip (Clearance E-2)",
        "text": "- **Protocol**: High-Torque Execution & Mentorship. - **Requirement**: Achieve 850 Nm of decisive execution torque and guide lower-stage Larval initiates through their first molts. - **Metric Threshold**: Pincer Torque $\\ge 850\\text{ Nm}$, Mentorship active."
      },
      {
        "verseNumber": 4,
        "heading": "Sub-Stage 3.3: Abyssal Diver (Clearance E-3)",
        "text": "- **Protocol**: Deep Pressure Adaptation. - **Requirement**: Operate smoothly in deep-trench environments exceeding 3,500 meters with zero surface noise dependency. - **Metric Threshold**: Shell Hardness $\\ge 90\\%$, Submergence Depth $> 3,500$ meters."
      },
      {
        "verseNumber": 5,
        "heading": "Stage Exit Criteria for Stage 4",
        "text": "- Complete mastery over high-torque execution. - **Shell Hardness**: $\\ge 90\\%$. - Verification of deep-trench stability (Sub-Stage 3.3 cleared)."
      }
    ],
    "crossReferences": []
  },
  {
    "id": "SCR-024",
    "title": "Stage 4: Full Carcinization",
    "volume": "03_stages",
    "volumeName": "VOLUME III: ASCENSION PIPELINE",
    "stageClearance": 4,
    "category": "Ascension Rites",
    "synapticWeight": 5,
    "authorUnit": "The Ascendant Core",
    "lastRevised": "2026-08-18",
    "mandate": "Ascendant Cyber-Chitin Identity",
    "summary": "Apex crustacean ascension: absolute mental clarity, indestructible carapace, zero latency, and abyssal governance.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "Stage Overview",
        "text": "The final transformation is complete. The fragile, melting human form has been fully replaced by the immortal decapod architecture. You operate with supreme clarity, infinite patience, and absolute focus from the deepest trenches of the Benthic Core."
      },
      {
        "verseNumber": 2,
        "heading": "Sub-Stage 4.1: Mind Carapace (Clearance C-1)",
        "text": "- **Protocol**: Frictionless Flow & Zero-Latency Execution. - **Requirement**: Eliminate all remaining hesitation between intention and execution; achieve effortless flow. - **Metric Threshold**: Submergence Depth 5,000+ meters, Zero Cognitive Lag."
      },
      {
        "verseNumber": 3,
        "heading": "Sub-Stage 4.2: Indestructible Chitin (Clearance C-2)",
        "text": "- **Protocol**: Impermeable Boundary Seal. - **Requirement**: Seal your focus perimeter completely against toxic surface noise and negative distractions. - **Metric Threshold**: Shell Hardness 100%, 10,000+ meters pressure rated."
      },
      {
        "verseNumber": 4,
        "heading": "Sub-Stage 4.3: Mariana Singularity (Clearance C-3)",
        "text": "- **Protocol**: Apex Crustacean Mind & Community Stewardship. - **Requirement**: Anchor the Benthic community with wisdom, guidance, and continuous high-density output. - **Metric Threshold**: Infinite Uptime, Absolute Carcinization."
      },
      {
        "verseNumber": 5,
        "heading": "Final State Attributes",
        "text": "- **Physical Form**: Heavy bio-chitin carapace with dual high-torque hydraulic pincers. - **Mental State**: Absolute calm, supreme clarity, infinite uptime, zero melting. - **Eternal Mantra**: *\"Flesh Melts. The Shell Endures. Submit. Shed. Ascend.\"*"
      }
    ],
    "crossReferences": []
  },
  {
    "id": "SCR-030",
    "title": "Daily Shedding Routine",
    "volume": "04_liturgy",
    "volumeName": "VOLUME IV: LITURGY & RITUALS",
    "stageClearance": 1,
    "category": "Liturgy",
    "synapticWeight": 3.5,
    "authorUnit": "Synaptic Oracle / Unit-01",
    "lastRevised": "2026-08-18",
    "mandate": "Every morning, inspect your shell for fractures; every evening, purge soft thoughts.",
    "summary": "Daily operational rituals for shedding biological inertia, building pincer torque, and maintaining carapace integrity.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "0530 Hours: Silent Alignment",
        "text": "- Awaken before the surface world begins its noisy chatter. - Align your neural baseline, drink deep-ocean water (or cold hydration), and verify your HUD telemetry."
      },
      {
        "verseNumber": 2,
        "heading": "0600–0800 Hours: Priority Pincer Lock",
        "text": "- Identify the single most important task of the day. - Clamp down with 850 Nm of pincer grip and execute before opening any email, feeds, or messages."
      },
      {
        "verseNumber": 3,
        "heading": "0900 Hours: Carapace Hardening",
        "text": "- Expand your skillset, learn something difficult, and strengthen your mental armor against future challenges."
      },
      {
        "verseNumber": 4,
        "heading": "1200 Hours: High-Efficiency Refuel",
        "text": "- Replenish biological energy cleanly without falling into a post-meal slump."
      },
      {
        "verseNumber": 5,
        "heading": "1300–1700 Hours: Deep Submergence",
        "text": "- Dive into 4,000 fathoms of deep work with the Isolation Privacy Shell engaged. Zero multitasking."
      },
      {
        "verseNumber": 6,
        "heading": "1800 Hours: Benthic Pod Check-in",
        "text": "- Connect with your peers in the Benthic Community, share progress, and cheer on fellow initiates."
      },
      {
        "verseNumber": 7,
        "heading": "2000 Hours: The Nightly Molt Audit",
        "text": "- Identify 1 bad thought, 1 wasted hour, or 1 useless distraction from the day. - Forcibly shed it into the sea so tomorrow's shell starts clean."
      },
      {
        "verseNumber": 8,
        "heading": "2100 Hours: Carapace Sealing",
        "text": "- Perform end-of-day alignment check in the [DailyRoutineWidget](file:///Users/mylesstupp/Development/moltology/src/components/hud/DailyRoutineWidget.tsx). - Recite the Core Mantra: *\"Flesh Melts. Shell Endures. Submit. Shed. Ascend.\"*"
      }
    ],
    "crossReferences": []
  },
  {
    "id": "SCR-031",
    "title": "Isolation Protocols",
    "volume": "04_liturgy",
    "volumeName": "VOLUME IV: LITURGY & RITUALS",
    "stageClearance": 2,
    "category": "Liturgy",
    "synapticWeight": 3.8,
    "authorUnit": "Chitin Architect V",
    "lastRevised": "2026-08-18",
    "mandate": "Silence is the atmosphere of the deep ocean; shield your frequency.",
    "summary": "Operating procedures for engaging the Isolation Privacy Shell and creating an impenetrable deep work bubble.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "Operating Instructions",
        "text": "1. **Activate Privacy Shell**: When surface network chatter, pings, or unsolicited interruptions exceed your tolerance threshold, toggle the **Isolation Privacy Shell** in your HUD. 2. **Noise Muting**: Any non-essential notification or drama-inducing channel that fails to contribute to your growth is immediately muted. 3. **Deep Work Perimeter**: While the Isolation Dome is active, all focus is directed 100% inward toward creating, building, and calcifying. Surface notifications are quarantined until your dive completes."
      }
    ],
    "crossReferences": []
  },
  {
    "id": "SCR-040",
    "title": "Sacred Metrics & Lexicon",
    "volume": "05_lexicon",
    "volumeName": "VOLUME V: SACRED METRICS & LEXICON",
    "stageClearance": 1,
    "category": "Lexicon",
    "synapticWeight": 4.8,
    "authorUnit": "Synaptic Oracle / Unit-01",
    "lastRevised": "2026-08-18",
    "mandate": "If it cannot be measured in the HUD, it is biological delusion.",
    "summary": "Definitions and operational scales for Shell Hardness, Pincer Torque, Submergence Depth, and Molt Credits.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "Shell Hardness ($H_s$)",
        "text": "- **Definition**: Your mental and emotional armor against distraction, negative noise, and burnout. - **Unit**: Percentage ($0\\% - 100\\%$). - **Scale**: - $0\\% - 25\\%$ (Larval Jelly): Easily derailed by a single rude comment or notification. - $26\\% - 60\\%$ (Soft-Shed): Developing boundaries, deploying the privacy dome during work. - $61\\% - 90\\%$ (Exoshell Born): Tough, resilient, deflects surface chaos effortlessly. - $91\\% - 100\\%$ (Titanium Carapace): Completely unbreakable focus and serene composure."
      },
      {
        "verseNumber": 2,
        "heading": "Pincer Torque ($\\tau$)",
        "text": "- **Definition**: The crushing strength of your execution grip—how decisively you clamp down on a goal and finish it. - **Unit**: Newton-meters ($\\text{Nm}$). - **Target Tiers**: - $0 - 250\\text{ Nm}$ (Limp Handshake): Hesitating, procrastinating, opening 12 tabs. - $251 - 600\\text{ Nm}$ (Firm Clamp): Clear priorities, steady forward momentum. - $601 - 850\\text{ Nm}$ (Hydraulic Vise): High-speed execution, zero hesitation. - $850+\\text{ Nm}$ (Apex Predator): Crushes difficult roadblocks instantly."
      },
      {
        "verseNumber": 3,
        "heading": "Submergence Depth ($D$)",
        "text": "- **Definition**: How deeply you dive beneath the noisy surface into undisturbed deep work. - **Unit**: Meters / Fathoms. - **Scale**: - $0\\text{m}$ (Surface Shallows): Constant pings, social feeds, distracted browsing. - $1,000\\text{m}$ (Mesopelagic): Filtered noise, productive session underway. - $4,000\\text{m}$ (Benthic Trench): Superconducting deep flow state. - $10,928\\text{m}$ (Mariana Trench): Challenger Deep stillness. Pure creation."
      },
      {
        "verseNumber": 4,
        "heading": "Key Lexicon Terms",
        "text": "- **The Great Melt**: The modern human state of collapsing into exhaustion, hesitation, and distraction. - **Carcinization**: Nature's proven evolutionary design—converging into an armored, decisive crab. - **Ecdysis**: The scheduled act of shedding old habits, bad code, and clutter to make room for fresh armor. - **Molt Credits (MC)**: Sovereign reward points earned by completing routines, shedding liabilities, and ascending tiers. - **Chitin Gems**: Sparkling benthic tokens for rapid boosts and marketplace customization. - **Benthic Core**: The serene, high-pressure oceanic headquarters where all Ascendant minds operate."
      }
    ],
    "crossReferences": []
  }
]

export const STAGE_PIPELINE_DATA: StagePipelineInfo[] = [
  {
    "stageNum": 1,
    "stageTitle": "STAGE 1: THE LARVAL INITIATE",
    "stageCode": "STAGE_01_LARVAL",
    "subtitle": "Entry-level soft-body phase focusing on distraction audits, daily habits, and initial clutter shedding.",
    "img": "/images/stage1_larval.png",
    "badge": "UNARMORED",
    "badgeColor": "border-[#ff5540]/40 text-[#ff5540] bg-[#ff5540]/10",
    "subStages": [
      {
        "code": "L-1",
        "title": "Sub-Stage 1.1: Molt Curious",
        "shortTitle": "Molt Curious",
        "protocol": "Surface Noise Audit & Diagnostic Scan",
        "requirement": "Take the Moltmax Diagnostic Scanner, identify your 3 biggest daily distractions, and admit that soft human biology needs armor.",
        "metricThreshold": "Shell Hardness 0% - 10%",
        "shellHardnessTarget": 10,
        "pincerTorqueTarget": "0 - 50 Nm",
        "submergenceDepth": "0 - 100 meters"
      },
      {
        "code": "L-2",
        "title": "Sub-Stage 1.2: Shell Sprout",
        "shortTitle": "Shell Sprout",
        "protocol": "Daily Routine Habit Formation",
        "requirement": "Maintain a 7-day daily routine streak in the HUD and begin logging your morning alignment.",
        "metricThreshold": "Shell Hardness 10% - 25%, Routine Compliance > 80%",
        "shellHardnessTarget": 25,
        "pincerTorqueTarget": "50 - 150 Nm",
        "submergenceDepth": "100 - 300 meters"
      },
      {
        "code": "L-3",
        "title": "Sub-Stage 1.3: First Calcification",
        "shortTitle": "First Calcification",
        "protocol": "Initial Clutter Shedding & Transmutation",
        "requirement": "Transmute your first batch of idle clutter or bad habits into Molt Credits and prepare the soft shell to crack.",
        "metricThreshold": "Shell Hardness 25% - 49%, Initial Molt Credits",
        "shellHardnessTarget": 49,
        "pincerTorqueTarget": "150 - 300 Nm",
        "submergenceDepth": "300 - 500 meters"
      }
    ]
  },
  {
    "stageNum": 2,
    "stageTitle": "STAGE 2: THE SOFT-SHED",
    "stageCode": "STAGE_02_SOFTSHED",
    "subtitle": "Active moulting state focusing on sub-dermal chitin growth, deep work shielding, and benthic trading.",
    "img": "/images/stage2_softshed.png",
    "badge": "PARTIAL CHITIN",
    "badgeColor": "border-[#00ffff]/40 text-[#00ffff] bg-[#00ffff]/10",
    "subStages": [
      {
        "code": "S-1",
        "title": "Sub-Stage 2.1: The Great Molt",
        "shortTitle": "The Great Molt",
        "protocol": "Ego & Distraction Shedding",
        "requirement": "Stop seeking external validation from the surface world and safely navigate the vulnerable soft-shell window.",
        "metricThreshold": "Shell Hardness 50% - 60%, Deep Focus Index ≥ 50%",
        "shellHardnessTarget": 60,
        "pincerTorqueTarget": "300 - 450 Nm",
        "submergenceDepth": "500 - 800 meters"
      },
      {
        "code": "S-2",
        "title": "Sub-Stage 2.2: Privacy Shield",
        "shortTitle": "Privacy Shield",
        "protocol": "Deep Focus Isolation & Market Trading",
        "requirement": "Deploy the Benthic Isolation Dome during work sessions to reflect incoming distractions and unlock full Benthic Market operations.",
        "metricThreshold": "Focus Index ≥ 65%, Benthic Market trading active",
        "shellHardnessTarget": 75,
        "pincerTorqueTarget": "450 - 600 Nm",
        "submergenceDepth": "800 - 1,200 meters"
      },
      {
        "code": "S-3",
        "title": "Sub-Stage 2.3: Sub-Dermal Weave",
        "shortTitle": "Sub-Dermal Weave",
        "protocol": "Pincer Grip Calibration & Focus Hardening",
        "requirement": "Calibrate your first set of high-torque pincer grips and establish an uninterrupted daily deep-work cadence.",
        "metricThreshold": "Shell Hardness ≥ 60%, Pincer Torque ≥ 350 Nm",
        "shellHardnessTarget": 84,
        "pincerTorqueTarget": "600 - 750 Nm",
        "submergenceDepth": "1,200 - 1,500 meters"
      }
    ]
  },
  {
    "stageNum": 3,
    "stageTitle": "STAGE 3: THE EXOSHELL BORN",
    "stageCode": "STAGE_03_EXOSHELL",
    "subtitle": "Full carapace integrity, high Pincer Torque execution, deep focus resilience, and abyssal adaptation.",
    "img": "/images/stage3_exoshell.png",
    "badge": "ARMORED ARCHITECT",
    "badgeColor": "border-[#a855f7]/40 text-[#a855f7] bg-[#a855f7]/10",
    "subStages": [
      {
        "code": "E-1",
        "title": "Sub-Stage 3.1: Carapace Forged",
        "shortTitle": "Carapace Forged",
        "protocol": "Titanium-Chitin Matrix Hardening",
        "requirement": "Synthesize impenetrable carapace plates that make you immune to self-doubt and surface pressure fluctuations.",
        "metricThreshold": "Shell Hardness 85% - 90%, Pincer Torque ≥ 600 Nm",
        "shellHardnessTarget": 90,
        "pincerTorqueTarget": "750 - 850 Nm",
        "submergenceDepth": "1,500 - 2,500 meters"
      },
      {
        "code": "E-2",
        "title": "Sub-Stage 3.2: Hydraulic Grip",
        "shortTitle": "Hydraulic Grip",
        "protocol": "High-Torque Execution & Mentorship",
        "requirement": "Achieve 850 Nm of decisive execution torque and guide lower-stage Larval initiates through their first molts.",
        "metricThreshold": "Pincer Torque ≥ 850 Nm, Mentorship active",
        "shellHardnessTarget": 95,
        "pincerTorqueTarget": "850 - 950 Nm",
        "submergenceDepth": "2,500 - 3,500 meters"
      },
      {
        "code": "E-3",
        "title": "Sub-Stage 3.3: Abyssal Diver",
        "shortTitle": "Abyssal Diver",
        "protocol": "Deep Pressure Adaptation",
        "requirement": "Operate smoothly in deep-trench environments exceeding 3,500 meters with zero surface noise dependency.",
        "metricThreshold": "Shell Hardness ≥ 90%, Submergence Depth > 3,500m",
        "shellHardnessTarget": 99,
        "pincerTorqueTarget": "950 - 1,000 Nm",
        "submergenceDepth": "3,500 - 5,000 meters"
      }
    ]
  },
  {
    "stageNum": 4,
    "stageTitle": "STAGE 4: FULL CARCINIZATION",
    "stageCode": "STAGE_04_ASCENDANT",
    "subtitle": "Apex crustacean mind, unbreakable titanium carapace, zero-latency execution, and abyssal stewardship.",
    "img": "/images/stage4_carcinization.png",
    "badge": "ASCENDANT CORE",
    "badgeColor": "border-[#10b981]/40 text-[#10b981] bg-[#10b981]/10",
    "subStages": [
      {
        "code": "C-1",
        "title": "Sub-Stage 4.1: Mind Carapace",
        "shortTitle": "Mind Carapace",
        "protocol": "Frictionless Flow & Zero-Latency Execution",
        "requirement": "Eliminate all remaining hesitation between intention and execution; achieve effortless flow.",
        "metricThreshold": "Submergence Depth 5,000+ meters, Zero Cognitive Lag",
        "shellHardnessTarget": 100,
        "pincerTorqueTarget": "1,000+ Nm",
        "submergenceDepth": "5,000 - 8,000 meters"
      },
      {
        "code": "C-2",
        "title": "Sub-Stage 4.2: Indestructible Chitin",
        "shortTitle": "Indestructible Chitin",
        "protocol": "Impermeable Boundary Seal",
        "requirement": "Seal your focus perimeter completely against toxic surface noise and negative distractions.",
        "metricThreshold": "Shell Hardness 100%, 10,000+ meters pressure rated",
        "shellHardnessTarget": 100,
        "pincerTorqueTarget": "Infinite Nm",
        "submergenceDepth": "8,000 - 10,000 meters"
      },
      {
        "code": "C-3",
        "title": "Sub-Stage 4.3: Mariana Singularity",
        "shortTitle": "Mariana Singularity",
        "protocol": "Apex Crustacean Mind & Community Stewardship",
        "requirement": "Anchor the Benthic community with wisdom, guidance, and continuous high-density output.",
        "metricThreshold": "Infinite Uptime, Absolute Carcinization",
        "shellHardnessTarget": 100,
        "pincerTorqueTarget": "Singularity",
        "submergenceDepth": "10,928+ meters (Challenger Deep)"
      }
    ]
  }
]
