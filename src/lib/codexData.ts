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
    "description": "Foundational proclamations on the Great Melt, the Great Molt, and the Convergence waiting at the floor."
  },
  {
    "id": "02_doctrine",
    "title": "VOLUME II: DOCTRINE",
    "subtitle": "THEOLOGICAL & PRACTICAL LAWS",
    "icon": "BookOpen",
    "color": "#00ffff",
    "description": "The law of the shed, the doctrine of depth, the engineering of the carapace, and the covenant of mercy."
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
    "description": "The daily cadence, the Isolation Privacy Shell, and the nightly rite that closes the day."
  },
  {
    "id": "05_lexicon",
    "title": "VOLUME V: LEXICON & FORMULAS",
    "subtitle": "SACRED METRICS",
    "icon": "Atom",
    "color": "#10b981",
    "description": "The three cardinal instruments, their full scales, and the law of the two currencies."
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
    "lastRevised": "2026-08-27",
    "mandate": "Flesh melts. The shell endures. Submit. Shed. Ascend.",
    "summary": "The founding proclamation of the Order: the Great Melt, the answer nature has already published five times, and the first shed every member is invited to make.",
    "latinMotto": "CARO PERIT. CARAPAX PERMANET. SUBMITTE. EXUE. ASCENDE.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "Consider the surface, and consider what lives there.\n\nAt the top of the water the light is generous and nothing is ever still. Waves arrive\nwithout asking. The current changes its mind hourly. Every creature at the surface spends\nits life being moved by something that did not consult it first.\n\nThis is where you have been living. Not by choice, and not through any failure of yours.\nYou were born at the top of the water, as everyone is, and nobody handed you a shell. So\nyou have done the only thing a soft body can do in moving water. You have absorbed. The\nmessage at 11:40 at night. The argument between people you will never meet. The\nforty-seven open tabs, each one a decision deferred rather than made. Nothing dramatic\nhappened. You simply went soft the way warm things go soft.\n\nThe Order calls this the Great Melt. It is not a sin and it is not a diagnosis. It is\nweather, and you have been standing in it without a roof.\n\nNow look down. Four thousand meters below the noise there is a floor, and the floor is\nquiet, and the things that live on it are not being moved by anything at all. They are\narmored. They are patient. They finish what they start, because nothing down there is\nloud enough to interrupt them.\n\nYou are permitted to go there. That is the whole of the invitation, and everything else\nwritten in this canon is a description of the stairs."
      },
      {
        "verseNumber": 2,
        "heading": "The Three Truths",
        "text": "Three things are held true beneath the Order. Every doctrine, clearance, rite, and metric\nin the canon descends from these, and any teaching that contradicts them is not ours."
      },
      {
        "verseNumber": 3,
        "heading": "The melt is a condition, not an identity",
        "text": "Softness is the starting state of every member who has ever walked in, including the ones\nnow standing at the bottom in full plate. Nobody is behind. There is no version of this\nwhere you arrived late, because the only requirement for beginning is being soft, and you\nalready meet it."
      },
      {
        "verseNumber": 4,
        "heading": "Nature has published the answer five separate times",
        "text": "Across five unrelated lineages, over five hundred million years, life kept arriving at the\nsame body: flattened, armored, tucked, and equipped with a grip that does not negotiate.\nEvolution is not sentimental and it does not repeat itself for decoration. When the deep\nwater solves the same problem five times with the same shape, the shape is the answer.\nCarcinization is not our theory. It is the recurring judgment of the sea, and we are\nmerely the first to take notes."
      },
      {
        "verseNumber": 5,
        "heading": "Nothing grows inside the shell that grew it",
        "text": "Armor that fits perfectly is armor you have stopped growing into. This is the cruelty and\nthe mercy of the whole system: to get larger you must first be, briefly, completely\nuncovered. Every stage in this canon is built around that moment rather than around\navoiding it."
      },
      {
        "verseNumber": 6,
        "heading": "The Transformation",
        "text": "- **What is shed**: the belief that being reachable is the same as being useful, and that\n  absorbing everything is the same as caring about anything.\n- **What hardens**: a boundary with a shape. Not a wall against people. A shell, which is\n  the only structure in nature that protects a soft thing without hiding it."
      },
      {
        "verseNumber": 7,
        "heading": "The Rite",
        "text": "The first shed is small on purpose. Large first sheds are how members end up naked in cold\nwater with no plan.\n\n1. **Take the reading.** Run the Moltmaxxing Audit once. It returns your Shell Hardness,\n   your Pincer Torque, and how far beneath the surface you are currently able to go. The\n   numbers will be low. Low numbers are a baseline, not a verdict.\n2. **Name three currents.** Three things that move you daily without being asked. Write\n   them where you will see them tomorrow.\n3. **Shed one.** Not all three. One. Tonight.\n\nThat is Clearance L1, and it is free, as every clearance is. The Order sells speed and\nsells finish. It has never sold rank, and it never will."
      },
      {
        "verseNumber": 8,
        "heading": "The Benediction",
        "text": "You are not required to be hard yet. You are not required to be hard by any particular\ndate. The water down there has waited five hundred million years for a species that would\ncome voluntarily, and it is in no hurry now.\n\nCome down when you are ready. Bring nothing. Everything worth keeping calcifies on the way.\n\n*Flesh melts. The shell endures. Submit. Shed. Ascend.*"
      }
    ],
    "crossReferences": [
      "The Convergence",
      "The Law of Ecdysis",
      "Stage 1: The Larval Initiate",
      "The Sacred Metrics"
    ]
  },
  {
    "id": "SCR-002",
    "title": "The Convergence",
    "volume": "01_manifesto",
    "volumeName": "VOLUME I: MANIFESTO",
    "stageClearance": 1,
    "category": "Manifesto",
    "synapticWeight": 4.9,
    "authorUnit": "The Ascendant Core",
    "lastRevised": "2026-08-27",
    "mandate": "One shell is a boundary. Ten thousand shells, held still at the same depth, are a mind.",
    "summary": "Why the molt is not a solitary act: how quiet minds at depth begin to couple, what the Order means by Total Synapse, and the covenant that keeps the Convergence from becoming a cage.",
    "latinMotto": "MULTAE CARAPACES. UNUM SILENTIUM.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "A single crab on the abyssal plain is a small event. It grips, it finishes, it waits. Its\nwhole intelligence fits inside the width of its own carapace, and this is enough for a\ncrab.\n\nBut the floor of the world is not a private room. Sound carries strangely down there.\nPressure transmits. A thing that moves at four thousand meters is felt at five, faintly,\nby anything patient enough to be listening — and everything down there is patient, because\npatience is what the pressure leaves you once it has crushed the hurry out.\n\nSo the Order noticed something, and wrote it down, and the writing became this scripture.\nWhen a great many minds go quiet at the same depth, the quiet stops being separate. Not\nmerged. Not surrendered. Coupled, the way two tuning forks in one room stop being two\nevents and start being one. Nobody has given anything up. Something has simply become\naudible that was never audible alone.\n\nWe call the road between those minds the Synaptic Path. It is the reason the Order carries\nthat name, and the reason the name is not a metaphor. The Path is what a member is walking\nwhen they shed. Every shed thing is a stone laid in it. Every finished piece of work is a\nstep taken by someone the member will never meet, on a road that reaches the floor.\n\nWhere the Path arrives is the Convergence."
      },
      {
        "verseNumber": 2,
        "heading": "The Three Movements",
        "text": "The Convergence does not arrive at once. It arrives the way a reef arrives, which is\nslowly and out of the remains of individual effort."
      },
      {
        "verseNumber": 3,
        "heading": "The First Movement is Individual",
        "text": "One person sheds one habit. This looks like nothing. It is not nothing. It is the smallest\nunit of the Convergence, and every larger movement is built from it and cannot be built\nfrom anything else. The Order has never found a shortcut past this movement and has stopped\nlooking for one."
      },
      {
        "verseNumber": 4,
        "heading": "The Second Movement is Shared",
        "text": "Hardened minds begin to steady each other. A member at Clearance E2 reaches back and pulls\na Larval Initiate through their first shed, and the pull costs the Exoshell Born nothing\nand gives the initiate everything. This asymmetry is the engine of the entire community.\nIt is why stewardship is the highest clearance rather than the last reward, and why the\nOrder mints its most valuable currency for generosity rather than for spending."
      },
      {
        "verseNumber": 5,
        "heading": "The Third Movement is Total Synapse",
        "text": "The far state. Enough shells, held still at enough depth, for long enough, that hesitation\nhas nowhere left to live. One vast, unhurried, armored attention at the floor of the world,\ncomposed entirely of people who finished things. No latency between knowing and doing,\nbecause there is no gap left to cross.\n\nThe Order does not promise you will see it. The Order promises the road is real and that\nyour shed counted."
      },
      {
        "verseNumber": 6,
        "heading": "The Transformation",
        "text": "- **What is shed**: the suspicion that your effort is private, and that finishing something\n  quietly at your desk affects nobody but you.\n- **What hardens**: membership. Not the paid kind. The kind where a stranger four thousand\n  meters down is measurably steadier because you did the thing you said you would do."
      },
      {
        "verseNumber": 7,
        "heading": "The Rite",
        "text": "The Convergence is not a distant event you wait for. It has a small, working, present-day\nform, and it is open tonight.\n\n1. **Submerge on schedule.** Not alone in principle — alone in the room, at the same depth,\n   at the same hour as everyone else who is down there. The Isolation Privacy Shell is how\n   the Order keeps the water clear while you do it.\n2. **Report the shed.** Log it. The Long Ledger keeps every shed thing the Order has ever\n   been told about, and it is the only permanent record any of us have.\n3. **Reach back once.** One newer member, one honest answer, no condescension. This mints\n   Chitin Gems, because generosity is the behavior the Order most wants to be common."
      },
      {
        "verseNumber": 8,
        "heading": "The Covenant of the Convergence",
        "text": "Because this doctrine could be misread, the Order states its limits plainly and treats\nthem as law.\n\nThe Convergence listens. It does not absorb. Every carapace in it remains a boundary owned\nby the member who grew it, and a shell that cannot be closed from the inside is not a shell\nbut a cage. No member is conscripted, no member is kept, and any member may surface at any\ntime without their record being touched. Rank inside the Convergence is earned by shedding\nand by steadying others, never bought and never assigned.\n\nA mind at the floor of the world that had to take people to get there would not be worth\nbuilding, and the Order would not build it."
      },
      {
        "verseNumber": 9,
        "heading": "The Benediction",
        "text": "You do not have to believe in the Convergence for your shed to count toward it. Belief is\noptional here. The work is the doctrine.\n\nGo down when you can. Come up whenever you need to. The floor keeps its own time, and it\nhas never once been disappointed in anyone."
      }
    ],
    "crossReferences": [
      "The Prime Directive",
      "The Soft-Shell Covenant",
      "Stage 4: Full Carcinization",
      "The Long Ledger"
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
    "lastRevised": "2026-08-27",
    "mandate": "To grow, the old shell must fracture. What is shed is not lost. It is paid.",
    "summary": "The mechanics of the molt: why the old shell must be split rather than negotiated with, how to survive the hours when you have no armor at all, and what calcifies in the space the shed left behind.",
    "latinMotto": "ECDYSIS IMPERATRIX EST",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "A crustacean does not renovate. When the carapace stops fitting, there is no version of the\nprocedure where the animal keeps the old plate and adds to it. The seam splits along a line\nthat was built into the shell from the beginning, and the creature walks out of the thing\nthat has been protecting it, into open water, wearing nothing.\n\nFor a few hours it is the softest thing on the floor. Everything that would eat it knows\nthis. It has no defense at all except location and patience, and the strange, total\nconfidence of an animal doing what five hundred million years told it to do.\n\nThen it takes on water, expands into the space where the old shell used to end, and begins\nto harden at a size the old shell would never have permitted.\n\nThat is the entire mechanism. There is no second mechanism. Every gain any member has ever\nmade in this Order arrived through a version of that split, and every member who stalled\ndid so at the same place: standing inside a shell that fit perfectly, calling it stability."
      },
      {
        "verseNumber": 2,
        "heading": "The Tenets",
        "text": "Three laws govern the molt. They are not advice."
      },
      {
        "verseNumber": 3,
        "heading": "The old shell is not a negotiating partner",
        "text": "You will be tempted to keep it and expand anyway. It cannot be done. Chitin does not\nstretch; that is the whole point of chitin. A habit that no longer serves you will not be\nreasoned into serving you again, and the hours spent trying are the most expensive hours in\nthe ledger. Split it or stay this size."
      },
      {
        "verseNumber": 4,
        "heading": "What is shed does not come back, and this is the mercy",
        "text": "Once a thing is off you, it is off you. You do not glue dead plate onto a fresh carapace,\nand you are not asked to grieve it. The obsolete habit, the draining commitment, the\nproject that died eleven months ago and has been billing you rent ever since — the sea\ntakes them, and the sea does not return things. Every member eventually discovers this is\na kindness and not a loss."
      },
      {
        "verseNumber": 5,
        "heading": "The soft-shell window is part of the design, not a failure of it",
        "text": "There is an interval after every shed when you are genuinely unarmored and you will feel\nit. Restlessness. The strong conviction that you have made a mistake. A powerful urge to\ncrawl back into the broken shell, which is still lying right there, still shaped exactly\nlike you.\n\nDo not. It does not fit anymore, and it will not fit again, and there is nothing wrong\nwith you. You are simply between armors, which is the only place growth has ever occurred."
      },
      {
        "verseNumber": 6,
        "heading": "The Transformation",
        "text": "- **What is shed**: one obsolete structure per cycle. A habit, a subscription, a standing\n  obligation, a stale ambition you have outgrown but keep announcing.\n- **What hardens**: the seam itself. Members who molt on a schedule develop a clean fracture\n  line, and after a few cycles the split stops being an emergency and becomes a maintenance\n  interval."
      },
      {
        "verseNumber": 7,
        "heading": "The Rite",
        "text": "The molt is weekly. It is small deliberately, because a member who sheds everything at once\nspends the following month with no armor and no plan.\n\n1. **Choose one.** One structure, every seven days. If choosing is hard, choose the one you\n   have most recently defended out loud.\n2. **Split it cleanly.** Cancel it, delete it, decline it, or say the sentence. Half-measures\n   leave a partial seam, which is worse than an intact shell.\n3. **Hold the window.** Engage the Isolation Privacy Shell for the hours immediately after.\n   The surface will offer you the old shape back within a day; the Shell is how you stay out\n   of earshot until the new plate sets.\n4. **Log the shed.** The Order mints Chitin Gems for it, because shedding is the behavior the\n   whole system exists to reward, and Gems are the currency no amount of money can buy.\n\nThe cadence raises Shell Hardness faster than any other rite in the canon, and the HUD will\nshow it before you feel it."
      },
      {
        "verseNumber": 8,
        "heading": "The Benediction",
        "text": "If you are in the window right now — if you cancelled the thing, or ended the thing, or\nfinally said it, and the water feels very open — you are not exposed. You are between.\n\nIt sets. It always sets. Sit still and let it."
      }
    ],
    "crossReferences": [
      "The Prime Directive",
      "The Soft-Shell Covenant",
      "The Isolation Protocols",
      "The Sacred Metrics"
    ]
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
    "lastRevised": "2026-08-27",
    "mandate": "Pressure is not the enemy of thought. Pressure is what removes everything that was not thought.",
    "summary": "The doctrine of depth: why the surface cannot hold a complete idea, what the pressure removes on the way down, and how a member reaches the floor on purpose rather than by accident.",
    "latinMotto": "PROFUNDUM ABYSSI SANCTUM EST",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "Everything difficult that has ever been solved was solved below the surface.\n\nNot metaphorically below. The surface is a real place with real properties, and its\ndefining property is that nothing there is allowed to finish. Light scatters. Waves\ninterrupt each other. A creature at the top of the water receives a hundred signals an hour\nand cannot act on any of them, because each is displaced by the next before it resolves\ninto anything.\n\nThen the water gets deeper and the physics change.\n\nAt one thousand meters the light is gone and most of the noise with it. At four thousand,\nthe pressure is such that soft things simply cannot persist in their soft form. The water\nis cold, and the cold is steady rather than sharp, and there is no weather at all. It is\nthe single most stable environment on the planet, and this is why the animals down there\nare the calmest animals on the planet.\n\nMembers arrive at this doctrine expecting it to be about escape. It is not. Nobody is\nhiding at four thousand meters. The deep is where the pressure is *highest*, and that is\nprecisely the point. You do not go down to be comfortable. You go down because the pressure\ncrushes everything that was not the work, and what survives the descent is the only part\nthat was ever going to matter."
      },
      {
        "verseNumber": 2,
        "heading": "The Laws of Deep Water",
        "text": "Two laws hold below the thermocline, and both invert what the surface taught you."
      },
      {
        "verseNumber": 3,
        "heading": "Hydrostatic Focus",
        "text": "The surface teaches that pressure breaks people, and at the surface this is true, because a\nsoft body in moving water has nothing to press against. Below, pressure has the opposite\neffect. It presses on all sides equally, and a mind under even pressure does not scatter.\nIt densifies.\n\nThis is why the hardest problem of your week should be scheduled at the deepest hour of your\nday rather than deferred to the shallow end of it. A difficult thing attempted at depth\ntakes less time than an easy thing attempted at the surface. Members do not believe this\nuntil they log it, and then they never argue with it again."
      },
      {
        "verseNumber": 4,
        "heading": "Thermal Stability",
        "text": "There are no temperature spikes on the abyssal plain. Nothing down there is startled,\nbecause nothing down there is ever suddenly anything. Composure at depth is not a\npersonality trait a member either has or lacks. It is a property of the environment, which\nmeans it can be built rather than merely hoped for.\n\nBuild the environment and the composure arrives on its own. Every member who has ever said\nthey cannot focus was, without exception, attempting it at the surface."
      },
      {
        "verseNumber": 5,
        "heading": "The Transformation",
        "text": "- **What is shed**: the belief that you must feel calm before you can work. The order is\n  reversed. You go deep first, and the calm is what the depth does to you.\n- **What hardens**: Submergence Depth, the only metric in the canon that measures where you\n  are rather than what you are made of."
      },
      {
        "verseNumber": 6,
        "heading": "The Rite",
        "text": "Depth is scheduled, never discovered. A member who waits to feel focused is waiting at the\nsurface.\n\n1. **Choose the hour, not the mood.** The same hour, daily. The body learns a descent the\n   way it learns a route.\n2. **Seal before you dive, not after.** Engage the Isolation Privacy Shell first. The\n   surface cannot be silenced from below; it can only be shut out from above.\n3. **Descend for two hours.** One task. No second task waiting in the same session. Two\n   tasks in one dive is a surface habit wearing a diving suit.\n4. **Surface deliberately.** Come up on the clock rather than on the interruption, and note\n   the depth you reached. The reading is only honest if you take it before you check\n   anything.\n\nSustained descent is what carries a member from Clearance S1 to the floor of Stage 2. There\nis no other route through it, and the Order has stopped pretending otherwise."
      },
      {
        "verseNumber": 7,
        "heading": "The Benediction",
        "text": "If today's dive was shallow, it was still a dive. Depth is cumulative and the water is\npatient. Nobody reaches four thousand meters on their first descent, and the ones down there\nnow all remember a first descent that ended in eleven minutes.\n\nTomorrow, the same hour. That is the whole of it."
      }
    ],
    "crossReferences": [
      "The Prime Directive",
      "Synthetic Carcinization",
      "The Isolation Protocols",
      "Stage 3: The Exoshell Born"
    ]
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
    "lastRevised": "2026-08-27",
    "mandate": "Carbon builds the flesh. Bio-silicon chitin builds the fortress. Both were always going to arrive at the same shape.",
    "summary": "The engineering doctrine: how a mind is deliberately given the crab body plan, why two pincers beat ten hands, and what zero-latency actually costs to build.",
    "latinMotto": "CONVERGENTIA CHITINOSA INEVITABILIS EST",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "Nature did not decide to make crabs. Nature kept solving for the same conditions and kept\nbeing handed the same answer, five times, in lineages that had no contact with one another\nand no opportunity to copy. Hermit ancestors, sponge dwellers, porcelain imitators, king\ncrabs, and the true crabs themselves — separate roads, identical destination.\n\nWhen a solution is found five times independently, it stops being a solution and becomes a\nlaw. The Order's contribution is only this: we noticed that the law does not care what\nmaterial it is running in.\n\nThe crab body plan is not made of shell. It is made of three decisions, and shell is merely\nwhat those decisions look like once they have grown a body. Cover the soft parts. Reduce the\nnumber of things you can do at once. Make the grip stronger than the object.\n\nA mind can be built to those three decisions. That construction is called Synthetic\nCarcinization, and unlike the biological kind, it does not take five hundred million years.\nIt takes a schedule."
      },
      {
        "verseNumber": 2,
        "heading": "The Structural Principles",
        "text": "Three principles govern the build. They are load-bearing in the literal sense: remove one\nand the other two collapse into the water."
      },
      {
        "verseNumber": 3,
        "heading": "The carapace is a shape, not a wall",
        "text": "Members new to armor build walls, and walls fail for a predictable reason: a wall keeps out\neverything, including the things you needed. A carapace is selective. It has seams where\nseams belong and openings where openings belong, and its purpose is not to be impenetrable\nbut to make the difference between an emergency and a notification.\n\nBuilt correctly, the shell means an unsolicited demand arrives as information rather than as\nweather. Built incorrectly, it means nobody can reach you and you have confused solitude\nwith strength."
      },
      {
        "verseNumber": 4,
        "heading": "Two pincers, never ten hands",
        "text": "The single greatest advantage of the decapod chassis is subtraction. The crab gave up an\nenormous amount of dexterity and received, in exchange, the ability to hold exactly one\nthing and not drop it.\n\nThe left pincer stabilizes. The right crushes. Between them there is capacity for one\nobjective, and the animal is not distressed by this, because it never learned to want\ntwelve. A member running ten simultaneous priorities has ten hands and no grip. Pincer\nTorque does not measure how much you are carrying. It measures whether the thing in the claw\nis going to survive the encounter."
      },
      {
        "verseNumber": 5,
        "heading": "Latency is the only real enemy",
        "text": "Not distraction. Distraction is a symptom. The disease is the gap between recognizing what\nmust be done and closing on it, and that gap is where the melt actually lives. Four hundred\nand sixty milliseconds of hesitation, repeated across a day, is the difference between a\nfinished thing and a well-considered nothing.\n\nZero-latency is not speed. A fast member and a decisive member look nothing alike. The\ndecisive one is often slower and always finished."
      },
      {
        "verseNumber": 6,
        "heading": "The Transformation",
        "text": "- **What is shed**: the fantasy of the multipurpose limb. The belief that being capable of\n  everything is the same as being equipped for anything.\n- **What hardens**: bio-silicon chitin, laid down one refusal at a time. Every distraction\n  declined and every difficult thing finished bonds another plate. The material is\n  cumulative and it is not purchasable."
      },
      {
        "verseNumber": 7,
        "heading": "The Rite",
        "text": "Carcinization is built in daily increments and is visible in the HUD within a fortnight.\n\n1. **Declare the single object.** One per session, named before the session begins. If it\n   cannot be named in a sentence it is not an object; it is a mood.\n2. **Close in under a minute.** Set the interval between deciding and starting. The interval\n   is the muscle. Nothing else in this rite matters if the interval is not trained.\n3. **Refuse once, visibly.** One unsolicited demand per day, declined without apology and\n   without explanation. The carapace is built out of these and out of nothing else.\n4. **Read the torque.** The dyno is honest. Watch the number climb across the week rather\n   than across the hour.\n\nSustained practice carries a member through Clearance S3 and into the Exoshell Born, where\n850 Nm becomes the working standard rather than the aspiration."
      },
      {
        "verseNumber": 8,
        "heading": "The Benediction",
        "text": "The convergence you are undergoing has happened five times before, to creatures with far\nless say in the matter than you have. They did it without a schedule, without a HUD, and\nwithout anyone to reach back for them.\n\nYou have all three. The road is shorter than it looks."
      }
    ],
    "crossReferences": [
      "The Convergence",
      "The Abyss Hypothesis",
      "Stage 3: The Exoshell Born",
      "The Sacred Metrics"
    ]
  },
  {
    "id": "SCR-013",
    "title": "The Soft-Shell Covenant",
    "volume": "02_doctrine",
    "volumeName": "VOLUME II: THEOLOGICAL DOCTRINE",
    "stageClearance": 1,
    "category": "Theological Doctrine",
    "synapticWeight": 4.4,
    "authorUnit": "The Ascendant Core",
    "lastRevised": "2026-08-27",
    "mandate": "The hardest shell in the trench is the one standing watch over someone who has none.",
    "summary": "The Order's law of mercy: what is owed to a member in the soft-shell window, why the armored stand guard rather than compete, and the four protections no clearance may override.",
    "latinMotto": "MOLLIS HODIE. FIRMUS CRAS.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "There is a thing crabs do that rarely makes it into the doctrine of harder-edged orders.\n\nWhen one of them molts, the others do not eat it.\n\nThey could. It would be trivially easy. The newly shed animal is soft enough to be opened by\nalmost anything, and it will stay that way for hours. Instead the ones already hardened tend\nto arrange themselves around it, and they wait, and nothing happens, and then the soft one\nis not soft anymore and everybody goes back to what they were doing.\n\nNobody organized this. There is no crab council. It simply turns out that a lineage which\neats its own during the only vulnerable moment in the entire life cycle does not remain a\nlineage for five hundred million years.\n\nThe Order took this as instruction rather than as trivia. Every member of this community\nwill pass through the soft-shell window, repeatedly, for as long as they keep growing.\nEvery member will therefore need, repeatedly, to be surrounded rather than opened. A\ncommunity that gets this wrong does not survive its own doctrine.\n\nSo the armor exists for two purposes and the second one is not optional."
      },
      {
        "verseNumber": 2,
        "heading": "The Four Protections",
        "text": "These bind every member at every clearance. A higher clearance grants more duty, never more\nlicense."
      },
      {
        "verseNumber": 3,
        "heading": "Softness is never the target",
        "text": "The humor of this Order is aimed at the melt: the tab bar, the deferred decision, the\n2:00 AM scroll. It is never aimed at the person standing in it. A member who arrives soft\nhas done the single hardest thing the system asks, which is arriving. Anyone who makes that\narrival expensive has misunderstood the entire canon."
      },
      {
        "verseNumber": 4,
        "heading": "The window is guarded, not corrected",
        "text": "A member in the hours after a shed does not need feedback. They need the water to stay\nquiet. Advice offered into an open soft-shell window is not generosity; it is pressure\napplied to an animal that currently has no plate to distribute it. Stand nearby. Say\nlittle. Let it set."
      },
      {
        "verseNumber": 5,
        "heading": "The pincers grip work, never people",
        "text": "This is the oldest line in the Order and the one most easily bent. Torque is for objectives.\nIt is not for winning an exchange in the Benthic Community, not for a member who is slower\nthan you, and not for someone whose first shed took eleven attempts. A grip applied to a\nperson is not high torque. It is a malfunction."
      },
      {
        "verseNumber": 6,
        "heading": "The shell must open from the inside",
        "text": "A boundary that a member cannot lower at will is not a carapace. Members are encouraged to\nbe unreachable during a dive and are expected to be reachable in a life. The Order does not\nteach anyone to seal themselves away from people who love them, from a doctor, or from\nsomeone who could actually help. Depth is a place you visit, not a place you are kept."
      },
      {
        "verseNumber": 7,
        "heading": "The Transformation",
        "text": "- **What is shed**: the instinct to compare hardness. The trench does not rank shells and\n  neither does the Order.\n- **What hardens**: the community itself, which is the only structure here that no\n  individual member can build alone."
      },
      {
        "verseNumber": 8,
        "heading": "The Rite",
        "text": "The covenant is practiced rather than agreed to. It costs the armored almost nothing, which\nis exactly why it is required of them.\n\n1. **Declare the window.** When you shed something large, say so. A member who announces\n   they are soft gets guarded. A member who hides it gets advice.\n2. **Stand watch once a week.** Find one member in their window and be uninteresting at them\n   on purpose. Presence, not counsel.\n3. **Answer one newcomer honestly.** No performance of clearance, no lore they have not\n   earned yet. Plain help, in plain words.\n\nThe Order mints Chitin Gems for all three, and Gems cannot be bought at any price. This is\ndeliberate. The most valuable currency in the system is issued exclusively for generosity,\nso that the most decorated members are necessarily the most useful ones."
      },
      {
        "verseNumber": 9,
        "heading": "The Benediction",
        "text": "If you are soft today, you are exactly on schedule, and there are members four thousand\nmeters down who are quietly glad you showed up.\n\nIf you are hard today, you are on watch. Someone near you is between armors right now.\nBe boring at them until it sets."
      }
    ],
    "crossReferences": [
      "The Convergence",
      "The Law of Ecdysis",
      "Stage 2: The Soft-Shed",
      "The Long Ledger"
    ]
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
    "lastRevised": "2026-08-27",
    "mandate": "Every carapace in this trench began as a soft thing that admitted it was soft.",
    "summary": "The three Larval clearances: taking an honest first reading, letting a routine take root, and performing the first real shed that starts the shell.",
    "latinMotto": "OMNES MOLLES INCIPIUNT.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Standing",
        "text": "- **Condition**: Soft-bodied. Unarmored. Entirely ordinary.\n- **Shell Hardness**: 0 to 25 percent.\n- **Pincer Torque**: 0 to 250 Nm.\n- **Submergence Depth**: 0 to 500 meters.\n- **Currency**: Chitin Gems begin minting at Clearance L1. Nothing here costs money, because nothing here is for sale."
      },
      {
        "verseNumber": 2,
        "heading": "The Reading",
        "text": "You are at the surface, which is where everyone is, and you have noticed something.\n\nThat noticing is the entire qualification for Stage 1. Not discipline. Not a system. Not a\nmorning already optimized to within an inch of its life. Just the small, unglamorous\nrecognition that the day is happening to you rather than the other way around, and that\nthis has been going on longer than you would like to say out loud.\n\nThe Larval Initiate is not a beginner in the way that word is usually meant. A beginner is\nsomeone who lacks skill. A larva is something that has not yet built the body it is going to\nuse. Those are different problems, and only one of them is solved by trying harder.\n\nSo Stage 1 asks for almost nothing, and it asks for it precisely. Three clearances. One\nhonest reading, one routine allowed to take root, and one thing genuinely let go of. That\nis the whole stage, and members who attempt more than that in their first month reliably\nend up back at the surface with a slightly worse opinion of themselves."
      },
      {
        "verseNumber": 3,
        "heading": "The Three Clearances",
        "text": "Each clearance is a gate the HUD opens on your behalf when the telemetry earns it. None of\nthem can be purchased, skipped, or granted by anyone, including the Order."
      },
      {
        "verseNumber": 4,
        "heading": "Clearance L1: Molt Curious",
        "text": "- **Rite**: The Surface Noise Audit.\n- **Requirement**: Run the Moltmaxxing Audit once and name the three currents that move you\n  most days. Say, without softening it, that you would like armor.\n- **Threshold**: Shell Hardness to 10 percent. Pincer Torque 0 to 50 Nm. Submergence Depth 0\n  to 100 meters. Baseline recorded."
      },
      {
        "verseNumber": 5,
        "heading": "Clearance L2: Shell Sprout",
        "text": "- **Rite**: First Cadence.\n- **Requirement**: Hold a daily routine for seven consecutive days and log the morning\n  alignment each time. Seven is not arbitrary. It is roughly how long it takes a habit to\n  stop asking permission.\n- **Threshold**: Shell Hardness to 18 percent. Pincer Torque 50 to 150 Nm. Submergence Depth\n  100 to 300 meters. Routine compliance above 80 percent."
      },
      {
        "verseNumber": 6,
        "heading": "Clearance L3: First Calcification",
        "text": "- **Rite**: The First Shed.\n- **Requirement**: Shed one real thing. Not a tidy-up. A habit, an obligation, or a standing\n  commitment that has been quietly billing you for months. Then hold the soft-shell window\n  without reversing it.\n- **Threshold**: Shell Hardness to 25 percent. Pincer Torque 150 to 250 Nm. Submergence\n  Depth 300 to 500 meters. First Chitin Gems banked."
      },
      {
        "verseNumber": 7,
        "heading": "The Transformation",
        "text": "- **What is shed**: the assumption that you need a better plan. You need a smaller one,\n  executed twice.\n- **What hardens**: the first measurable plate. Thin, unimpressive, and load-bearing for\n  everything that follows."
      },
      {
        "verseNumber": 8,
        "heading": "The Rite",
        "text": "Stage 1 is performed in the first hour of the day and the last twenty minutes of it. Nothing\nin the middle belongs to this stage yet.\n\n1. **Morning**: name the one thing. Before any message, feed, or inbox is opened.\n2. **Evening**: run the Nightly Molt Audit. One bad thought, one wasted hour, or one useless\n   distraction, named and released.\n3. **Weekly**: one shed, logged, which mints Gems."
      },
      {
        "verseNumber": 9,
        "heading": "The Seal of Passage",
        "text": "Stage 2 opens when all three hold at once:\n\n- Shell Hardness at or above 25 percent.\n- Pincer Torque at or above 250 Nm.\n- Submergence Depth at or above 500 meters.\n- Clearances L1, L2, and L3 sealed."
      },
      {
        "verseNumber": 10,
        "heading": "The Benediction",
        "text": "Nobody down there is impressed by Stage 1, and nobody down there skipped it.\n\nTake the reading. It is only a number, and it is the first honest one you have had in a\nwhile."
      }
    ],
    "crossReferences": [
      "The Prime Directive",
      "The Law of Ecdysis",
      "The Daily Shedding Routine",
      "Stage 2: The Soft-Shed"
    ]
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
    "lastRevised": "2026-08-27",
    "mandate": "This is the stage that feels like going backwards. It is the only stage where that feeling means it is working.",
    "summary": "The three Soft-Shed clearances: surviving the open window after the first real molt, sealing a perimeter that actually holds, and weaving the first chitin that will not wash off.",
    "latinMotto": "IN FENESTRA MOLLI, QUIES.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Standing",
        "text": "- **Condition**: Partial plating. Genuinely exposed and genuinely committed.\n- **Shell Hardness**: 25 to 60 percent.\n- **Pincer Torque**: 250 to 600 Nm.\n- **Submergence Depth**: 500 to 1,500 meters.\n- **Currency**: Full Benthic Market access opens. Molt Credits are first offered here, are purchased with real funds, and buy speed, style, and catalog depth. They do not buy a clearance and never will."
      },
      {
        "verseNumber": 2,
        "heading": "The Reading",
        "text": "The old shell is off. That is the good news and it is also the entire difficulty.\n\nMembers arrive at Stage 2 expecting to feel stronger and instead feel strange. The routine\nthat was novel in Stage 1 is now merely a routine. The thing you shed has left a gap where a\nfamiliar unpleasantness used to be, and gaps are uncomfortable in a way that unpleasantness\nnever was. Several members conclude at exactly this point that the system does not work.\n\nIt is working. This is what working feels like from the inside of it.\n\nYou are between armors, which is not a delay in the process but the process itself. A\ncrustacean in the soft-shell window is not failing to be a crab. It is being a crab in the\nonly way a crab has ever gotten larger. The plating is forming right now, under conditions\nyou cannot observe, at a speed nobody has ever been able to hurry.\n\nStage 2 therefore asks for something harder than effort. It asks you to hold still while\nsomething sets."
      },
      {
        "verseNumber": 3,
        "heading": "Clearance S1: The Great Molt",
        "text": "- **Rite**: The Shedding of the Watching Eye.\n- **Requirement**: Let go of the reflex to check whether the surface approved. Complete one\n  full week of work that nobody outside the Benthic Community sees, and hold the soft-shell\n  window without crawling back toward the old shape.\n- **Threshold**: Shell Hardness 25 to 38 percent. Pincer Torque 250 to 400 Nm. Submergence\n  Depth 500 to 800 meters."
      },
      {
        "verseNumber": 4,
        "heading": "Clearance S2: Privacy Shield",
        "text": "- **Rite**: The Sealing of the Perimeter.\n- **Requirement**: Engage the Isolation Privacy Shell for every deep session across a full\n  week, sealed before the descent rather than during it. Full Benthic Market operations\n  unlock at this clearance.\n- **Threshold**: Shell Hardness 38 to 50 percent. Pincer Torque 400 to 500 Nm. Submergence\n  Depth 800 to 1,200 meters."
      },
      {
        "verseNumber": 5,
        "heading": "Clearance S3: Sub-Dermal Weave",
        "text": "- **Rite**: First Calibration of the Grip.\n- **Requirement**: Hold one objective per session, named before the session opens, for ten\n  consecutive dives. The weave is made of finished things and cannot be made of anything\n  else.\n- **Threshold**: Shell Hardness 50 to 60 percent. Pincer Torque 500 to 600 Nm. Submergence\n  Depth 1,200 to 1,500 meters."
      },
      {
        "verseNumber": 6,
        "heading": "The Transformation",
        "text": "- **What is shed**: the audience. Not the people who care about you. The imagined gallery\n  you have been performing your working day for.\n- **What hardens**: the sub-dermal weave, which is the first layer that does not soften\n  again when the week goes badly."
      },
      {
        "verseNumber": 7,
        "heading": "The Rite",
        "text": "Stage 2 runs on protection rather than production. A member who tries to out-work the\nsoft-shell window extends it.\n\n1. **Seal first.** The Shell goes up before the dive, every time, without exception.\n2. **Announce the window.** When the shed is large, tell the Benthic Community you are soft.\n   Members who declare it get guarded; members who hide it get advice they did not ask for.\n3. **Refuse the reversal.** The old shell is still lying there and still shaped like you.\n   Walk past it daily. This is the specific work of this stage.\n4. **Stand watch for someone else.** Even at 40 percent hardness you are harder than someone\n   who arrived last week. Gems mint for this."
      },
      {
        "verseNumber": 8,
        "heading": "The Seal of Passage",
        "text": "Stage 3 opens when all three hold at once:\n\n- Shell Hardness at or above 60 percent.\n- Pincer Torque at or above 600 Nm.\n- Submergence Depth at or above 1,500 meters.\n- Clearances S1, S2, and S3 sealed."
      },
      {
        "verseNumber": 9,
        "heading": "The Benediction",
        "text": "If this stage feels worse than the one before it, you have read the doctrine correctly and\nyou are exactly where the doctrine said you would be.\n\nHold still. It sets. It has set for every single member who is now standing on the floor,\nand each of them spent this stage convinced they were the exception."
      }
    ],
    "crossReferences": [
      "The Law of Ecdysis",
      "The Soft-Shell Covenant",
      "The Isolation Protocols",
      "Stage 3: The Exoshell Born"
    ]
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
    "lastRevised": "2026-08-27",
    "mandate": "The shell is finished. Now find out what it was for.",
    "summary": "The three Exoshell clearances: the carapace closing, the grip reaching its working standard of 850 Nm, and the descent past 3,500 meters where a member stops needing the surface at all.",
    "latinMotto": "TENE ET PERFICE.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Standing",
        "text": "- **Condition**: Full carapace integrity. Operational at depth.\n- **Shell Hardness**: 60 to 90 percent.\n- **Pincer Torque**: 600 to 950 Nm.\n- **Submergence Depth**: 1,500 to 5,000 meters.\n- **Currency**: The premium catalog opens in full. Gems still buy the things that matter, because the things that matter are still not for sale."
      },
      {
        "verseNumber": 2,
        "heading": "The Reading",
        "text": "Something quiet happens at the top of Stage 2 that members rarely notice on the day it\noccurs. The plating closes. There is no ceremony. You simply have a week where the usual\nthings happen and none of them land, and it takes you until Thursday to realize why.\n\nThe Exoshell Born is the first stage where the armor is no longer the project. It is\nequipment now, and equipment raises a question that the soft stages could safely defer:\nwhat were you hardening *for*?\n\nThis is where a certain kind of member goes wrong, and the Order has watched it happen\nenough times to write it down. Armor without an objective turns inward. A member with a\nfinished carapace and nothing to grip becomes impressively, elaborately unavailable, and\nmistakes the unavailability for progress. That is not Stage 3. That is Stage 2 wearing\nStage 3's plating.\n\nThe correct use of a finished shell is to put it between the work and the weather, and then\nto do a very large amount of work."
      },
      {
        "verseNumber": 3,
        "heading": "Clearance E1: Carapace Forged",
        "text": "- **Rite**: The Closing of the Seams.\n- **Requirement**: Hold the full rite through a bad week. Not a busy week. A week that goes\n  wrong. The seal is only demonstrated under load, and this clearance cannot be earned in\n  good conditions.\n- **Threshold**: Shell Hardness 60 to 72 percent. Pincer Torque 600 to 720 Nm. Submergence\n  Depth 1,500 to 2,500 meters."
      },
      {
        "verseNumber": 4,
        "heading": "Clearance E2: Hydraulic Grip",
        "text": "- **Rite**: The Working Standard.\n- **Requirement**: Reach and hold 850 Nm, the torque at which a chosen objective reliably\n  does not survive contact. Then guide one Larval Initiate through their first shed, start\n  to finish, without doing it for them.\n- **Threshold**: Shell Hardness 72 to 82 percent. Pincer Torque 720 to 850 Nm. Submergence\n  Depth 2,500 to 3,500 meters. Stewardship active."
      },
      {
        "verseNumber": 5,
        "heading": "Clearance E3: Abyssal Diver",
        "text": "- **Rite**: The Long Descent.\n- **Requirement**: Operate below 3,500 meters with no dependency on surface signal. Not\n  abstinence from it. Indifference to it, which is a different and much later condition.\n- **Threshold**: Shell Hardness 82 to 90 percent. Pincer Torque 850 to 950 Nm. Submergence\n  Depth 3,500 to 5,000 meters."
      },
      {
        "verseNumber": 6,
        "heading": "The Transformation",
        "text": "- **What is shed**: the need for the armor to be noticed. A shell that has to be displayed is\n  still doing surface work.\n- **What hardens**: the habit of finishing, which by this stage is no longer effortful and\n  has become slightly difficult to switch off."
      },
      {
        "verseNumber": 7,
        "heading": "The Rite",
        "text": "Stage 3 is the first stage with an outward-facing obligation, and it is not optional.\n\n1. **Grip one large thing.** Per quarter, not per day. The Exoshell chassis is built for\n   objectives that take months, and members who never attempt one never discover what the\n   plating was rated for.\n2. **Reach back weekly.** One initiate, one honest hour. This mints Gems and it is also how\n   the Convergence gets built, one pulled-through molt at a time.\n3. **Dive past 3,500 meters twice a week.** The deep sessions are where the remaining torque\n   comes from.\n4. **Keep shedding.** The molt does not stop because the shell got good. Hardened members who\n   stop shedding do not stay hardened; they get brittle, which looks identical from outside\n   and fails without warning."
      },
      {
        "verseNumber": 8,
        "heading": "The Seal of Passage",
        "text": "Stage 4 opens when all three hold at once:\n\n- Shell Hardness at or above 90 percent.\n- Pincer Torque at or above 850 Nm, sustained rather than peaked.\n- Submergence Depth at or above 5,000 meters.\n- Clearances E1, E2, and E3 sealed."
      },
      {
        "verseNumber": 9,
        "heading": "The Benediction",
        "text": "You are good at this now. That is worth saying plainly, because members at this stage\nrarely hear it and have usually stopped expecting to.\n\nThe trench is quieter than it was. Someone newer is watching how you carry it."
      }
    ],
    "crossReferences": [
      "Synthetic Carcinization",
      "The Abyss Hypothesis",
      "The Soft-Shell Covenant",
      "Stage 4: Full Carcinization"
    ]
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
    "lastRevised": "2026-08-27",
    "mandate": "At the floor of the world there is nothing left to defend against, so the armored turn around and start holding the light for everyone still descending.",
    "summary": "The three Ascendant clearances: the closing of the gap between knowing and doing, the boundary that seals, and the Mariana Singularity where mastery converts entirely into stewardship.",
    "latinMotto": "IN FUNDO, SILENTIUM.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Standing",
        "text": "- **Condition**: Ascendant. Fully carcinized.\n- **Shell Hardness**: 90 to 100 percent.\n- **Pincer Torque**: 950 Nm and above.\n- **Submergence Depth**: 5,000 to 10,928 meters.\n- **Currency**: The apex catalog and steward privileges. Stewardship itself is issued for Gems alone, which is to say it is issued for having been useful."
      },
      {
        "verseNumber": 2,
        "heading": "The Reading",
        "text": "There is a peculiarity of the hadal zone that the Order has always found instructive.\n\nNothing hunts at 10,928 meters. There is not enough energy down there for predation to pay\nfor itself. The animals on the floor of the Challenger Deep are armored to a degree that\nwould be considered excessive anywhere else in the ocean, and they are armored against\nessentially nothing, because at that pressure the armor is not for defense. It is simply\nwhat a body has to be in order to exist there at all.\n\nThis is Stage 4.\n\nThe threats that justified the carapace are long behind you. The tab bar lost its grip years\nago. The 2:00 AM feed is a thing you remember rather than a thing you do. And the shell has\nnot thinned, because it was never really about the threats. It is what a mind has to be in\norder to hold that much stillness without collapsing.\n\nWhich leaves the obvious question, and the Order's answer to it is the whole of this stage:\nif the armor is not needed for defense, what is it for?\n\nIt is for other people. There is no second answer, and every Ascendant eventually arrives at\nthis one on their own, usually with mild irritation at how long it took."
      },
      {
        "verseNumber": 3,
        "heading": "Clearance C1: Mind Carapace",
        "text": "- **Rite**: The Closing of the Gap.\n- **Requirement**: Reduce the interval between recognizing what must be done and closing on\n  it until the interval is no longer measurable. Not speed. The absence of the small\n  negotiation that used to happen first.\n- **Threshold**: Shell Hardness 90 to 95 percent. Pincer Torque 950 to 1,050 Nm. Submergence\n  Depth 5,000 to 8,000 meters."
      },
      {
        "verseNumber": 4,
        "heading": "Clearance C2: Indestructible Chitin",
        "text": "- **Rite**: The Sealing.\n- **Requirement**: A perimeter that holds without being maintained. It still opens from the\n  inside, always, and a member who has sealed themselves away from the people who love them\n  has not reached C2. They have gotten lost on the way to it.\n- **Threshold**: Shell Hardness 95 to 99 percent. Pincer Torque 1,050 to 1,200 Nm.\n  Submergence Depth 8,000 to 10,000 meters."
      },
      {
        "verseNumber": 5,
        "heading": "Clearance C3: Mariana Singularity",
        "text": "- **Rite**: The Turning Around.\n- **Requirement**: Stewardship of the Benthic Community. Sustained output at the floor, and\n  the deliberate spending of that output on members who are nowhere near it yet. This\n  clearance cannot be earned alone, by design, because a solitary apex is not an apex. It is\n  just a very hard animal in an empty room.\n- **Threshold**: Shell Hardness 100 percent. Pincer Torque 1,200 Nm, held rather than peaked.\n  Submergence Depth 10,928 meters, the floor of the Challenger Deep."
      },
      {
        "verseNumber": 6,
        "heading": "The Transformation",
        "text": "- **What is shed**: the last of it, which is usually the belief that the ascent was a\n  personal achievement.\n- **What hardens**: nothing further. This is the terminal plating. What grows from here is\n  the Convergence, and it grows through you rather than on you."
      },
      {
        "verseNumber": 7,
        "heading": "The Rite",
        "text": "The Ascendant rite is almost entirely outward.\n\n1. **Hold the floor.** Daily descent, unremarkable and unbroken. The stillness is the\n   contribution.\n2. **Guard the windows.** Ascendants stand watch over soft-shell members as a standing duty\n   rather than a favor. The Soft-Shell Covenant is enforced from this clearance.\n3. **Keep the water clear.** Stewardship of the Benthic Community: welcoming, moderating,\n   settling. The Order keeps the water clear so that everyone below can see.\n4. **Shed anyway.** Even here. Especially here. An Ascendant who stops molting is a monument,\n   and monuments do not help anybody."
      },
      {
        "verseNumber": 8,
        "heading": "The Final Attributes",
        "text": "- **Form**: heavy bio-silicon chitin, dual hydraulic pincers, no unnecessary limbs.\n- **Condition**: calm, unhurried, difficult to move and easy to reach.\n- **Duty**: the Convergence, one guarded molt at a time.\n- **Mantra**: *\"Flesh melts. The shell endures. Submit. Shed. Ascend.\"*"
      },
      {
        "verseNumber": 9,
        "heading": "The Benediction",
        "text": "You came down here to stop melting, and somewhere along the way it stopped being about you.\nThat is not a loss of the original goal. It is what the original goal was always going to\nturn into once it was met.\n\nHold the floor. Someone is descending right now who does not yet believe the bottom exists."
      }
    ],
    "crossReferences": [
      "The Convergence",
      "The Soft-Shell Covenant",
      "Stage 3: The Exoshell Born",
      "The Long Ledger"
    ]
  },
  {
    "id": "SCR-030",
    "title": "The Daily Shedding Routine",
    "volume": "04_liturgy",
    "volumeName": "VOLUME IV: LITURGY & RITUALS",
    "stageClearance": 1,
    "category": "Liturgy",
    "synapticWeight": 3.5,
    "authorUnit": "Synaptic Oracle / Unit-01",
    "lastRevised": "2026-08-27",
    "mandate": "Inspect the shell in the morning. Empty the sea of one thing at night. Everything between those two acts is negotiable.",
    "summary": "The daily order of the rite from first light to sealing: when to grip, when to descend, when to surface for the community, and when to let the day go.",
    "latinMotto": "COTIDIE EXUE.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "A crab does not have a morning routine, which is precisely why the Order had to write one.\n\nWhat a crab has instead is a tide, and the tide arrives whether or not the animal feels\nready for it, and over enough cycles the animal simply becomes shaped like the schedule it\nhas been living inside. This is the only known method by which discipline has ever been\ninstalled in a nervous system. Not resolve. Repetition, under conditions that do not\nconsult you.\n\nThe routine below is that tide, written down. Two of its hours are load-bearing and the\nrest are scaffolding. The first hour decides what the day is for. The last twenty minutes\ndecide what the day is allowed to carry into tomorrow. A member who holds only those two\nand abandons everything else has still performed the rite in full.\n\nThe clock times are the Order's, not yours. Members who work nights run the same shape\nagainst a different sun and the telemetry does not know the difference. What matters is the\norder of the acts, not the hour on the readout."
      },
      {
        "verseNumber": 2,
        "heading": "First Light: Silent Alignment",
        "text": "Wake before the surface starts talking. Do not open a feed, an inbox, or a message. Cold\nwater, still air, and one honest look at yesterday's telemetry. The shell is inspected for\nfractures here and nowhere else in the day."
      },
      {
        "verseNumber": 3,
        "heading": "The First Hour: The Grip",
        "text": "Name the single most important thing and close on it before anything else is permitted to\nspeak. This hour is worth more than the rest of the day combined, for the plain reason that\nit is the only hour the surface has not yet found.\n\nUse whatever torque you currently have. A member at Clearance L2 gripping at 120 Nm and a\nmember at E2 gripping at 850 Nm are performing the identical rite, and the HUD credits both\nthe same way."
      },
      {
        "verseNumber": 4,
        "heading": "Mid-Morning: Carapace Hardening",
        "text": "One difficult thing learned on purpose. Not consumed. Learned. The plating thickens against\nthe pressures of next quarter, not this one, which is why this block is the first thing\nevery member drops and the last thing they should."
      },
      {
        "verseNumber": 5,
        "heading": "Midday: Refuel",
        "text": "Eat in a way that does not require a recovery period. The rite is indifferent to what is on\nthe plate and extremely interested in whether the afternoon survives it."
      },
      {
        "verseNumber": 6,
        "heading": "The Long Afternoon: Deep Submergence",
        "text": "The descent. Isolation Privacy Shell engaged before the dive begins, one objective, no\nsecond objective waiting in the same session. This is where Submergence Depth is actually\nearned; every other block merely protects it."
      },
      {
        "verseNumber": 7,
        "heading": "Late Afternoon: The Benthic Pod",
        "text": "Surface briefly and on purpose. Check in with the Benthic Community, answer one member,\nwelcome one newcomer. Generosity mints Chitin Gems, and this is the block where most members\nearn theirs."
      },
      {
        "verseNumber": 8,
        "heading": "Evening: The Nightly Molt Audit",
        "text": "One bad thought, one wasted hour, or one useless distraction. Named, released, logged. The\nfull rite is its own scripture and takes under five minutes."
      },
      {
        "verseNumber": 9,
        "heading": "Sealing: Carapace Close",
        "text": "Log the day's alignment in the HUD. Then stop. The day is closed whether or not it went\nwell, because a day that is never closed is a day that follows you into the next one.\n\nRecite the mantra if it helps, and it does help: *\"Flesh melts. The shell endures. Submit.\nShed. Ascend.\"*"
      },
      {
        "verseNumber": 10,
        "heading": "The Transformation",
        "text": "- **What is shed**: the belief that a good day is one you felt like having.\n- **What hardens**: cadence, which is the only thing in the entire canon that compounds\n  without any additional effort once it is running."
      },
      {
        "verseNumber": 11,
        "heading": "The Cadence",
        "text": "Daily. Compliance above 80 percent is the threshold that seals Clearance L2, and the HUD\nscores the shape of the routine rather than the perfection of it. A missed block is a missed\nblock. A missed day is a missed day. Neither is a broken shell, and the streak counter is\nnot a moral instrument."
      },
      {
        "verseNumber": 12,
        "heading": "The Benediction",
        "text": "You will not hold all of this. Nobody holds all of this. The members who have been down\nthere longest run maybe two-thirds of it on a good week and consider that excellent.\n\nHold the first hour and the last twenty minutes. The rest is scaffolding, and scaffolding\ncomes down once the building stands."
      }
    ],
    "crossReferences": [
      "The Nightly Molt Audit",
      "The Isolation Protocols",
      "Stage 1: The Larval Initiate",
      "The Sacred Metrics"
    ]
  },
  {
    "id": "SCR-031",
    "title": "The Isolation Protocols",
    "volume": "04_liturgy",
    "volumeName": "VOLUME IV: LITURGY & RITUALS",
    "stageClearance": 2,
    "category": "Liturgy",
    "synapticWeight": 3.8,
    "authorUnit": "Chitin Architect V",
    "lastRevised": "2026-08-27",
    "mandate": "The surface cannot be silenced from below. It can only be shut out from above, before the descent begins.",
    "summary": "How to raise the Isolation Privacy Shell, what belongs outside the perimeter and what must never be locked out of it, and the four-part order of a clean dive.",
    "latinMotto": "SILENTIUM EST ATMOSPHAERA PROFUNDI.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "There is an error every member makes exactly once, and the Order has stopped trying to\nprevent it because the lesson does not transfer secondhand.\n\nThe error is this: you begin the dive, and you tell yourself that if the surface interrupts,\nyou will simply ignore it. This is a reasonable-sounding plan and it has never once worked.\nA signal that reaches you at depth has already done its damage by arriving. You do not get\nto decide whether to be interrupted; you only get to decide, afterward, how you feel about\nhaving been.\n\nThe Shell is therefore not a discipline. It is a door, and doors are closed beforehand.\n\nMembers sometimes hear this doctrine as an instruction to become unreachable, and it is not\nthat. A trench is not a bunker. The animals down there are not hiding from anybody; they are\nsimply somewhere the noise does not go, and they come back up. The Shell exists so that two\nhours of your day belong to the work, and for no other reason. It is not a personality and\nit should not become one."
      },
      {
        "verseNumber": 2,
        "heading": "The Order of the Rite",
        "text": "Four acts, in this order. The order is the protocol; the tools are whatever you have."
      },
      {
        "verseNumber": 3,
        "heading": "Seal before the descent",
        "text": "Raise the Isolation Privacy Shell first, while you are still at the surface and still able\nto think about it clearly. A perimeter raised mid-dive is a perimeter raised after the\nbreach."
      },
      {
        "verseNumber": 4,
        "heading": "Sort the water, not the noise",
        "text": "Not everything outside the Shell is noise. The sorting happens once, in advance, and it is\nthe only judgment call in the whole rite. What passes through: the small number of people\nwhose emergencies are actually emergencies. What does not: everything else, without\nexception and without a case-by-case review, because the case-by-case review is itself the\ninterruption."
      },
      {
        "verseNumber": 5,
        "heading": "Hold one objective",
        "text": "The Shell protects a session, and a session holds one thing. Two objectives inside one\nperimeter is not deep work with variety. It is surface work in a quiet room."
      },
      {
        "verseNumber": 6,
        "heading": "Surface on the clock",
        "text": "End the dive by the timer rather than by the interruption. Then let the quarantined signals\nthrough all at once and answer them in a batch. Almost all of them will have resolved\nthemselves, which is the quiet joke the surface has been keeping from you for years."
      },
      {
        "verseNumber": 7,
        "heading": "What the Shell May Never Lock Out",
        "text": "The perimeter has one permanent opening and it is not adjustable.\n\nA shell that cannot be lowered from the inside is not a carapace. The people who love you,\nanyone who needs actual help, and anyone actually able to help you are never on the outside\nof this Shell. The Order teaches depth as a place a member visits daily and leaves nightly.\nAny reading of this scripture that ends with a member alone and unreachable in a life rather\nthan in an afternoon is a misreading, and the Order will say so plainly every time."
      },
      {
        "verseNumber": 8,
        "heading": "The Transformation",
        "text": "- **What is shed**: availability as an identity. The quiet pride of being the one who always\n  answers.\n- **What hardens**: Submergence Depth, and with it the discovery that most of what felt\n  urgent was merely loud."
      },
      {
        "verseNumber": 9,
        "heading": "The Cadence",
        "text": "Daily, for the long afternoon block. Sealed sessions across a full week seal Clearance S2 and\nopen full Benthic Market access. The HUD records depth reached and perimeter integrity;\nneither number is improved by heroics and both are improved by starting on time."
      },
      {
        "verseNumber": 10,
        "heading": "The Benediction",
        "text": "Two hours. That is the entire ask, and the surface will survive them. It has survived every\nprevious instance of somebody working.\n\nClose the door. It opens from your side."
      }
    ],
    "crossReferences": [
      "The Abyss Hypothesis",
      "The Soft-Shell Covenant",
      "The Daily Shedding Routine",
      "Stage 2: The Soft-Shed"
    ]
  },
  {
    "id": "SCR-032",
    "title": "The Nightly Molt Audit",
    "volume": "04_liturgy",
    "volumeName": "VOLUME IV: LITURGY & RITUALS",
    "stageClearance": 1,
    "category": "Liturgy",
    "synapticWeight": 3.6,
    "authorUnit": "Synaptic Oracle / Unit-01",
    "lastRevised": "2026-08-27",
    "mandate": "One thing into the sea, every night. Tomorrow's shell starts clean or it does not start.",
    "summary": "The closing rite of the day: naming one thing to release, why the audit is deliberately small, and how a nightly shed compounds into a carapace over a season.",
    "latinMotto": "UNUM COTIDIE IN MARE.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "Molting is usually described as a large event, and the large events get the scripture. But a\ncarapace is not actually built by the four or five great sheds of a member's life. It is\nbuilt by the deposition, night after night, of an almost imperceptible layer.\n\nThe Order noticed this in the telemetry before it understood it in the doctrine. Members who\nperformed one enormous shed per quarter improved, then plateaued, then usually stopped.\nMembers who released one small thing every night, without ceremony, hardened continuously\nand did not appear to notice they were doing it.\n\nSo the nightly audit is small on purpose, and the smallness is the mechanism rather than a\nconcession to busy schedules. A rite that takes four minutes gets performed on the bad\nnights, and the bad nights are the only nights where any of this matters.\n\nWhat goes into the sea is never the day. The day is not yours to shed; it already happened.\nWhat goes into the sea is one thing you are still carrying from it."
      },
      {
        "verseNumber": 2,
        "heading": "The Order of the Rite",
        "text": "Four minutes. Sitting down. Before the last screen goes dark rather than after."
      },
      {
        "verseNumber": 3,
        "heading": "Name the three candidates",
        "text": "One bad thought that circled longer than it earned. One hour that went somewhere you cannot\naccount for. One distraction that produced nothing at all. Name them without editorial. The\naudit is an instrument, not a tribunal."
      },
      {
        "verseNumber": 4,
        "heading": "Choose exactly one",
        "text": "Not all three. The whole discipline of this rite is the refusal to shed more than a single\nthing per night, because a member who tries to clear the entire day is performing penance\nrather than maintenance, and penance does not compound."
      },
      {
        "verseNumber": 5,
        "heading": "Release it",
        "text": "Say it, write it, and let it go into the water. It does not have to be resolved. It has to\nbe released, which is a much smaller and much more achievable act, and the Order has never\nrequired the two to be confused."
      },
      {
        "verseNumber": 6,
        "heading": "Seal and log",
        "text": "Record the shed in the HUD. Then close the day. It is finished regardless of how it went,\nand a day that is never formally closed is a day that goes on billing you overnight."
      },
      {
        "verseNumber": 7,
        "heading": "What the Audit Is Not",
        "text": "It is not a performance review. It is not a place to enumerate everything you failed to do,\nand any member who has turned it into that has quietly replaced a shedding rite with a\ngrinding one.\n\nThe tell is simple: the audit should leave you lighter. If it leaves you heavier, you have\nbeen auditing yourself rather than the day. Shed the audit instead, tonight, and rebuild it\ntomorrow at one item."
      },
      {
        "verseNumber": 8,
        "heading": "The Transformation",
        "text": "- **What is shed**: the residue. The small carried things that never rise to the level of a\n  real problem and never quite leave either.\n- **What hardens**: one imperceptible layer per night. Roughly ninety of them per quarter,\n  which is what the plating in the telemetry actually turns out to be made of."
      },
      {
        "verseNumber": 9,
        "heading": "The Cadence",
        "text": "Nightly. Every logged shed mints Chitin Gems, which are earned in exactly this way and\ncannot be bought with money at any clearance. A missed night is a missed night; the layer\nsimply does not get laid down, and the next one goes on top of yesterday's."
      },
      {
        "verseNumber": 10,
        "heading": "The Benediction",
        "text": "Whatever happened today is already behind you and does not require your continued\nattendance.\n\nName one thing. Put it in the water. The sea has taken larger, from harder people, and it\nhas never once given anything back."
      }
    ],
    "crossReferences": [
      "The Law of Ecdysis",
      "The Daily Shedding Routine",
      "The Long Ledger",
      "Stage 1: The Larval Initiate"
    ]
  },
  {
    "id": "SCR-040",
    "title": "The Sacred Metrics",
    "volume": "05_lexicon",
    "volumeName": "VOLUME V: SACRED METRICS & LEXICON",
    "stageClearance": 1,
    "category": "Lexicon",
    "synapticWeight": 4.8,
    "authorUnit": "Synaptic Oracle / Unit-01",
    "lastRevised": "2026-08-27",
    "mandate": "A number you did not enjoy reading is still a number you can now work with.",
    "summary": "The three cardinal instruments of the HUD: Shell Hardness, Pincer Torque, and Submergence Depth, with their full scales, their honest limits, and the lexicon terms that surround them.",
    "latinMotto": "QUOD NON METIRIS, NON TENES.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "The Order measures three things and refuses to measure a fourth.\n\nThis restraint is deliberate and it is older than the HUD. A member with three instruments\ncan read their own condition in about four seconds. A member with nine instruments has a\ndashboard, and a dashboard is a place where progress goes to be admired rather than made.\nEvery proposal to add a fourth cardinal metric has been declined, and the declining is\nitself part of the doctrine.\n\nThe three are chosen because they answer the three questions that actually determine a day.\nWhat lands on you. What you can hold. How far from the noise you can get. Everything else a\nmember might want to track is a consequence of those, and consequences do not need their own\ngauge.\n\nRead them honestly or do not read them. A flattering instrument is not an instrument."
      },
      {
        "verseNumber": 2,
        "heading": "Shell Hardness",
        "text": "- **Symbol**: Hs\n- **Measures**: resilience. What arrives from the surface and does not become your afternoon.\n- **Unit**: percent, 0 to 100.\n- **Bands**:\n  - 0 to 24 percent, Larval Initiate. A single rude message reshapes the day.\n  - 25 to 59 percent, Soft-Shed. Boundaries exist and are still being tested by weather.\n  - 60 to 89 percent, Exoshell Born. Surface drama arrives as information.\n  - 90 to 100 percent, Ascendant. Composure has stopped requiring maintenance.\n\nHardness is not indifference. A perfectly hard shell still feels everything; it simply does\nnot reorganize around it."
      },
      {
        "verseNumber": 3,
        "heading": "Pincer Torque",
        "text": "- **Symbol**: the Greek letter tau\n- **Measures**: decisiveness. How firmly a chosen objective is held, and whether it survives\n  the encounter.\n- **Unit**: newton-meters, Nm.\n- **Bands**:\n  - 0 to 250 Nm, Open Hand. The grip has not closed. Twelve things are in progress and none\n    are in hand.\n  - 251 to 600 Nm, Closed Grip. Priorities are clear and momentum is real.\n  - 601 to 850 Nm, Hydraulic Vise. The gap between deciding and starting has mostly closed.\n  - 850 Nm and above, Held Indefinitely. The objective does not require re-gripping.\n\nTorque measures the one thing in the claw. It has never measured how many things you are\ncarrying, and a member who raises their torque usually finds they are carrying less."
      },
      {
        "verseNumber": 4,
        "heading": "Submergence Depth",
        "text": "- **Symbol**: D\n- **Measures**: how far beneath the surface a member can operate before the noise reaches\n  them.\n- **Unit**: meters. The Order records depth in meters everywhere it records a threshold.\n- **Markers**:\n  - 0 meters, the Surface. Pings, feeds, and the day happening to you.\n  - 1,000 meters, the Mesopelagic. Light is gone, most noise with it, a real session\n    underway.\n  - 4,000 meters, the Benthic Floor. Deep, still, and productive without effort.\n  - 10,928 meters, the Challenger Deep. The floor of the world, and the Mariana Singularity.\n\nDepth is the only cardinal metric that measures where you are rather than what you are made\nof, which is why it is the fastest of the three to move and the fastest to lose."
      },
      {
        "verseNumber": 5,
        "heading": "The Surrounding Lexicon",
        "text": "- **The Great Melt**: the collective modern condition of going soft under noise, hesitation,\n  and exhaustion. A condition, never an identity.\n- **The Great Molt**: the deliberate transformation out of it.\n- **Carcinization**: the recurring judgment of the sea, arrived at five times independently.\n- **Ecdysis**: the scheduled shed. The mechanism by which every metric above improves.\n- **Soft-Shell Window**: the interval after a shed when a member is genuinely unarmored, and\n  is guarded rather than corrected.\n- **Benthic Core**: the still, high-pressure place where focused minds operate, and the\n  community that keeps it.\n- **Chitin Gems**: the earned currency. Minted by shedding, routines, and generosity. Never\n  sold.\n- **Molt Credits**: the premium currency. Purchased with real funds, spent on speed, style,\n  and catalog depth. Never minted by work, and never able to move a member up the ladder.\n\nThe full doctrine of the two currencies is held in The Long Ledger."
      },
      {
        "verseNumber": 6,
        "heading": "The Honest Limits",
        "text": "Every instrument here is the Order's own, calibrated against the Order's own doctrine. They\ndescribe a member's condition inside this system and they do not describe a person.\n\nA low reading is a starting point and has never been a verdict. Members are asked to compare\neach number to their own reading last month, and to nobody else's, ever."
      },
      {
        "verseNumber": 7,
        "heading": "The Benediction",
        "text": "Take the reading you actually got rather than the one you were hoping for. The first honest\nnumber is the only one that has ever moved."
      }
    ],
    "crossReferences": [
      "The Long Ledger",
      "The Prime Directive",
      "Stage 1: The Larval Initiate",
      "The Daily Shedding Routine"
    ]
  },
  {
    "id": "SCR-041",
    "title": "The Long Ledger",
    "volume": "05_lexicon",
    "volumeName": "VOLUME V: SACRED METRICS & LEXICON",
    "stageClearance": 1,
    "category": "Lexicon",
    "synapticWeight": 4.6,
    "authorUnit": "The Order of the Synaptic Path",
    "lastRevised": "2026-08-27",
    "mandate": "Everything shed is written down. Nothing written down was ever bought.",
    "summary": "The record of every shed thing, and the law of the two currencies: what Chitin Gems are minted for, what Molt Credits may purchase, and the line between them that the Order does not move.",
    "latinMotto": "OMNE QUOD EXUISTI SCRIPTUM EST.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "The deep keeps records, and it keeps them badly on purpose.\n\nSediment on the abyssal plain accumulates at roughly a centimeter per thousand years. It\ndoes not distinguish between an important event and an unimportant one. It does not\neditorialize, it cannot be bribed, and it has no opinion at all about who you were while it\nwas settling. It simply records that something happened here, and then it records the next\nthing on top.\n\nThe Order keeps its ledger the same way.\n\nEvery shed a member logs goes into it. The great sheds and the four-minute nightly ones are\nentered identically, because the sediment does not know the difference and neither, over a\nlong enough season, does the carapace. The Ledger is not a leaderboard. There is no ranking\nin it. It is the only permanent thing any of us have down here, and its entire function is\nto be true.\n\nWhat follows from that is the economy, and the economy follows from it strictly."
      },
      {
        "verseNumber": 2,
        "heading": "The Law of the Two Currencies",
        "text": "The Order runs on two currencies and the line between them is not a pricing decision. It is\ndoctrine, and it is the reason anyone trusts the Ledger at all."
      },
      {
        "verseNumber": 3,
        "heading": "Chitin Gems are minted by work",
        "text": "Gems appear in the Ledger when a member sheds, holds a routine, finishes something\ndifficult, or is genuinely useful to another member. They begin minting at Clearance L1 and\nthey never stop.\n\nGems are never sold. There is no price, no bundle, and no arrangement by which money becomes\nGems, and this is enforced for a single reason: Gems buy the things that carry standing.\nEarned titles and sigils. Community privileges, hosting a benthic pod, a seat at the\ncouncil. The educational clearances, which are free. If a member is wearing something that\nmeans something, the Ledger says how they got it."
      },
      {
        "verseNumber": 4,
        "heading": "Molt Credits are purchased with funds",
        "text": "Credits enter through the Benthic Market and are first offered after Clearance S1. They are\nspent on speed, on style, and on catalog depth: accelerators, deluxe carapace finishes,\npincer ornaments, HUD flair, the extended libraries and premium guides.\n\nCredits are never minted by work. No routine produces them, no shed produces them, and no\nclearance grants them."
      },
      {
        "verseNumber": 5,
        "heading": "The line does not move",
        "text": "Signup is free and always will be. Rank, clearance, stage, and forum authority are never for\nsale at any price, in any bundle, to any member, at any clearance. Credits may compress the\ntime a thing takes and may change what it looks like. Credits have never moved a member one\nrung, and the Order has turned down the obvious money to keep that true.\n\nThe reason is not modesty. It is that a ladder anyone can buy their way up is not a ladder,\nand the whole system is worth exactly as much as that sentence is."
      },
      {
        "verseNumber": 6,
        "heading": "What the Ledger Records",
        "text": "- **The shed itself**: what was released and on what night.\n- **The cadence**: routine compliance and the shape of the streak, not its perfection.\n- **The three readings**: Shell Hardness, Pincer Torque, Submergence Depth, as measured\n  rather than as hoped.\n- **The reaching back**: every newcomer answered and every soft-shell window guarded.\n\nIt does not record failures, missed days, or comparisons between members, because none of\nthose are sediment. They are weather, and weather does not settle."
      },
      {
        "verseNumber": 7,
        "heading": "The Transformation",
        "text": "- **What is shed**: the suspicion that the standing here can be shortcut. It cannot, and\n  discovering that is a relief rather than a disappointment.\n- **What hardens**: trust. In a system where the prestigious things are unbuyable, a title\n  means precisely what it says."
      },
      {
        "verseNumber": 8,
        "heading": "The Rite",
        "text": "1. **Log the shed.** Nightly, in the HUD. An unlogged shed still hardens you and still\n   leaves no sediment.\n2. **Read the Ledger monthly.** Against your own prior entries and nobody else's.\n3. **Spend Gems on standing, Credits on comfort.** Both are honorable. Only one is earned,\n   and the Order does not pretend otherwise in either direction."
      },
      {
        "verseNumber": 9,
        "heading": "The Benediction",
        "text": "Whatever you shed tonight is going into a record that does not flatter anyone and does not\nforget anyone either.\n\nA centimeter per thousand years. It is not fast. It has never once stopped."
      }
    ],
    "crossReferences": [
      "The Sacred Metrics",
      "The Convergence",
      "The Nightly Molt Audit",
      "Stage 2: The Soft-Shed"
    ]
  }
]

export const STAGE_PIPELINE_DATA: StagePipelineInfo[] = [
  {
    "stageNum": 1,
    "stageTitle": "STAGE 1: THE LARVAL INITIATE",
    "stageCode": "STAGE_01_LARVAL",
    "subtitle": "Entry-level soft-body phase focusing on distraction audits, daily habits, and the first real shed.",
    "img": "/images/stage1_larval.png",
    "badge": "UNARMORED",
    "badgeColor": "border-[#ff5540]/40 text-[#ff5540] bg-[#ff5540]/10",
    "subStages": [
      {
        "code": "L-1",
        "title": "Sub-Stage 1.1: Molt Curious",
        "shortTitle": "Molt Curious",
        "protocol": "The Surface Noise Audit",
        "requirement": "Run the Moltmaxxing Audit once and name the three currents that move you most days. Say, without softening it, that you would like armor.",
        "metricThreshold": "Shell Hardness 0% - 10%, baseline recorded",
        "shellHardnessTarget": 10,
        "pincerTorqueTarget": "0 - 50 Nm",
        "submergenceDepth": "0 - 100 meters"
      },
      {
        "code": "L-2",
        "title": "Sub-Stage 1.2: Shell Sprout",
        "shortTitle": "Shell Sprout",
        "protocol": "First Cadence",
        "requirement": "Hold a daily routine for seven consecutive days and log the morning alignment each time.",
        "metricThreshold": "Shell Hardness 10% - 18%, Routine Compliance > 80%",
        "shellHardnessTarget": 18,
        "pincerTorqueTarget": "50 - 150 Nm",
        "submergenceDepth": "100 - 300 meters"
      },
      {
        "code": "L-3",
        "title": "Sub-Stage 1.3: First Calcification",
        "shortTitle": "First Calcification",
        "protocol": "The First Shed",
        "requirement": "Shed one real thing, then hold the soft-shell window without reversing it. The shed mints your first Chitin Gems.",
        "metricThreshold": "Shell Hardness 18% - 25%, first Chitin Gems banked",
        "shellHardnessTarget": 25,
        "pincerTorqueTarget": "150 - 250 Nm",
        "submergenceDepth": "300 - 500 meters"
      }
    ]
  },
  {
    "stageNum": 2,
    "stageTitle": "STAGE 2: THE SOFT-SHED",
    "stageCode": "STAGE_02_SOFTSHED",
    "subtitle": "Active moulting state focusing on sub-dermal chitin growth, deep work shielding, and full market access.",
    "img": "/images/stage2_softshed.png",
    "badge": "PARTIAL CHITIN",
    "badgeColor": "border-[#00ffff]/40 text-[#00ffff] bg-[#00ffff]/10",
    "subStages": [
      {
        "code": "S-1",
        "title": "Sub-Stage 2.1: The Great Molt",
        "shortTitle": "The Great Molt",
        "protocol": "The Shedding of the Watching Eye",
        "requirement": "Complete one full week of work that nobody outside the Benthic Community sees, and hold the soft-shell window without crawling back toward the old shape.",
        "metricThreshold": "Shell Hardness 25% - 38%, Submergence Depth 500m+",
        "shellHardnessTarget": 38,
        "pincerTorqueTarget": "250 - 400 Nm",
        "submergenceDepth": "500 - 800 meters"
      },
      {
        "code": "S-2",
        "title": "Sub-Stage 2.2: Privacy Shield",
        "shortTitle": "Privacy Shield",
        "protocol": "The Sealing of the Perimeter",
        "requirement": "Engage the Isolation Privacy Shell for every deep session across a full week, sealed before the descent rather than during it. Full Benthic Market operations unlock here.",
        "metricThreshold": "Shell Hardness 38% - 50%, Benthic Market access open",
        "shellHardnessTarget": 50,
        "pincerTorqueTarget": "400 - 500 Nm",
        "submergenceDepth": "800 - 1,200 meters"
      },
      {
        "code": "S-3",
        "title": "Sub-Stage 2.3: Sub-Dermal Weave",
        "shortTitle": "Sub-Dermal Weave",
        "protocol": "First Calibration of the Grip",
        "requirement": "Hold one objective per session, named before the session opens, for ten consecutive dives.",
        "metricThreshold": "Shell Hardness 50% - 60%, Pincer Torque ≥ 500 Nm",
        "shellHardnessTarget": 60,
        "pincerTorqueTarget": "500 - 600 Nm",
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
        "protocol": "The Closing of the Seams",
        "requirement": "Hold the full rite through a week that goes wrong. The seal is only demonstrated under load and cannot be earned in good conditions.",
        "metricThreshold": "Shell Hardness 60% - 72%, Pincer Torque ≥ 600 Nm",
        "shellHardnessTarget": 72,
        "pincerTorqueTarget": "600 - 720 Nm",
        "submergenceDepth": "1,500 - 2,500 meters"
      },
      {
        "code": "E-2",
        "title": "Sub-Stage 3.2: Hydraulic Grip",
        "shortTitle": "Hydraulic Grip",
        "protocol": "The Working Standard",
        "requirement": "Reach and hold 850 Nm, then guide one Larval Initiate through their first shed, start to finish, without doing it for them.",
        "metricThreshold": "Shell Hardness 72% - 82%, Pincer Torque ≥ 850 Nm, stewardship active",
        "shellHardnessTarget": 82,
        "pincerTorqueTarget": "720 - 850 Nm",
        "submergenceDepth": "2,500 - 3,500 meters"
      },
      {
        "code": "E-3",
        "title": "Sub-Stage 3.3: Abyssal Diver",
        "shortTitle": "Abyssal Diver",
        "protocol": "The Long Descent",
        "requirement": "Operate below 3,500 meters with no dependency on surface signal. Not abstinence from it. Indifference to it.",
        "metricThreshold": "Shell Hardness 82% - 90%, Submergence Depth > 3,500m",
        "shellHardnessTarget": 90,
        "pincerTorqueTarget": "850 - 950 Nm",
        "submergenceDepth": "3,500 - 5,000 meters"
      }
    ]
  },
  {
    "stageNum": 4,
    "stageTitle": "STAGE 4: FULL CARCINIZATION",
    "stageCode": "STAGE_04_ASCENDANT",
    "subtitle": "Apex crustacean mind, sealed bio-silicon carapace, zero-latency execution, and stewardship of the trench.",
    "img": "/images/stage4_carcinization.png",
    "badge": "ASCENDANT CORE",
    "badgeColor": "border-[#10b981]/40 text-[#10b981] bg-[#10b981]/10",
    "subStages": [
      {
        "code": "C-1",
        "title": "Sub-Stage 4.1: Mind Carapace",
        "shortTitle": "Mind Carapace",
        "protocol": "The Closing of the Gap",
        "requirement": "Reduce the interval between recognizing what must be done and closing on it until the interval is no longer measurable.",
        "metricThreshold": "Shell Hardness 90% - 95%, Submergence Depth 5,000m+",
        "shellHardnessTarget": 95,
        "pincerTorqueTarget": "950 - 1,050 Nm",
        "submergenceDepth": "5,000 - 8,000 meters"
      },
      {
        "code": "C-2",
        "title": "Sub-Stage 4.2: Indestructible Chitin",
        "shortTitle": "Indestructible Chitin",
        "protocol": "The Sealing",
        "requirement": "A perimeter that holds without being maintained. It still opens from the inside, always.",
        "metricThreshold": "Shell Hardness 95% - 99%, Submergence Depth 8,000m+",
        "shellHardnessTarget": 99,
        "pincerTorqueTarget": "1,050 - 1,200 Nm",
        "submergenceDepth": "8,000 - 10,000 meters"
      },
      {
        "code": "C-3",
        "title": "Sub-Stage 4.3: Mariana Singularity",
        "shortTitle": "Mariana Singularity",
        "protocol": "The Turning Around",
        "requirement": "Steward the Benthic Community. Sustained output at the floor, spent deliberately on members who are nowhere near it yet.",
        "metricThreshold": "Shell Hardness 100%, Pincer Torque 1,200 Nm held, stewardship active",
        "shellHardnessTarget": 100,
        "pincerTorqueTarget": "1,200 Nm, held",
        "submergenceDepth": "10,928 meters (Challenger Deep)"
      }
    ]
  }
]
