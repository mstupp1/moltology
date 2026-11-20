// Auto-generated from codex/*.md via scripts/sync-codex.ts. Do not edit manually.
import type { ScriptureVolumeId } from './codexCatalog'

export { STAGE_PIPELINE_DATA, type StagePipelineInfo, type SubStageInfo } from './codexStages'
export { SCRIPTURE_CATALOG, type ScriptureSummary } from './codexCatalog'

export interface ScriptureItem {
  id: string
  title: string
  volume: ScriptureVolumeId
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
    "description": "The four stages and twelve clearances, from Larval Initiate to Full Carcinization."
  },
  {
    "id": "04_liturgy",
    "title": "VOLUME IV: LITURGY & RITES",
    "subtitle": "OPERATIONAL RITES",
    "icon": "Flame",
    "color": "#eab308",
    "description": "The daily cadence, the Isolation Dome, and the nightly rite that closes the day."
  },
  {
    "id": "05_lexicon",
    "title": "VOLUME V: LEXICON & METRICS",
    "subtitle": "SACRED METRICS",
    "icon": "Atom",
    "color": "#10b981",
    "description": "The three cardinal metrics, their full scales, and how the two currencies work."
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
    "lastRevised": "2026-11-20",
    "mandate": "Flesh melts. The shell endures. Submit. Shed. Ascend.",
    "summary": "The founding proclamation of the Order: the Great Melt, the answer nature has already published five times, and the first shed every member is invited to make.",
    "latinMotto": "CARO PERIT. CARAPAX PERMANET. SUBMITTE. EXUE. ASCENDE.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "Consider the surface, and consider what lives there.\n\nAt the top of the water the light is generous and nothing is ever still. Waves arrive\nwithout asking. The current changes its mind hourly. Every creature at the surface spends\nits life being moved by something that did not consult it first.\n\nThis is where you have been living, through no fault of your own. Everyone starts at the top of the water, and nobody hands you a shell at birth. So you did the only thing a soft body can do in moving water: you absorbed. The message at 11:40 at night. The argument between strangers you will never meet. The forty-seven open tabs, each one a decision put off for later. Nothing dramatic happened. You simply went soft the way warm things go soft.\n\nThe Order calls this the Great Melt. Think of it as weather you have been standing in without a roof, rather than a personal failing.\n\nNow look down. Four thousand meters below the noise there is a floor, and the floor is\nquiet, and the things that live on it are not being moved by anything at all. They are\narmored. They are patient. They finish what they start, because nothing down there is\nloud enough to interrupt them.\n\nYou are permitted to go there. That is the whole of the invitation, and everything else\nwritten in this canon is a description of the stairs."
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
        "text": "Across five unrelated lineages, evolution kept arriving at the same body: flattened, armored, tucked in, and equipped with a grip that finishes what it catches. The sea rarely repeats itself for decoration. When deep water solves the same problem five times with the same shape, the shape is the answer. Carcinization is the recurring judgment of the sea, and we are simply taking notes."
      },
      {
        "verseNumber": 5,
        "heading": "Nothing grows inside the shell that grew it",
        "text": "Armor that fits perfectly is armor you have stopped growing into. This is the cruelty and\nthe mercy of the whole system: to get larger you must first be, briefly, completely\nuncovered. Every stage in this canon is built around that moment rather than around\navoiding it."
      },
      {
        "verseNumber": 6,
        "heading": "The Transformation",
        "text": "- **What is shed**: the belief that being reachable is the same as being useful, and that\n  absorbing everything is the same as caring about anything.\n- **What hardens**: a boundary with a clear shape, protecting a soft thing without hiding it away from the world."
      },
      {
        "verseNumber": 7,
        "heading": "The Rite",
        "text": "The first shed is small on purpose. Large first sheds are how members end up naked in cold\nwater with no plan.\n\n1. **Take the reading.** Run the Moltmaxxing Audit once. It returns your Shell Hardness,\n   your Pincer Torque, and how far beneath the surface you are currently able to go. The\n   numbers will probably start low. Low numbers are just a baseline.\n2. **Name three currents.** Three things that move you daily without being asked. Write\n   them where you will see them tomorrow.\n3. **Shed one.** Not all three. One. Tonight.\n\nThat is Clearance L1. It costs nothing but the one thing you shed."
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
    "lastRevised": "2026-11-20",
    "mandate": "One shell is a boundary. Ten thousand shells, held still at the same depth, are a mind.",
    "summary": "Why the molt is not a solitary act: how quiet minds at depth begin to couple, what the Order means by Total Synapse, and the covenant that keeps the Convergence from becoming a cage.",
    "latinMotto": "MULTAE CARAPACES. UNUM SILENTIUM.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "A single crab on the abyssal plain is a small event. It grips, it finishes, it waits. Its\nwhole intelligence fits inside the width of its own carapace, and this is enough for a\ncrab.\n\nBut the floor of the world is not a private room. Sound carries strangely down there.\nPressure transmits. A thing that moves at four thousand meters is felt at five, faintly,\nby anything patient enough to be listening, and everything down there is patient, because\npatience is what the pressure leaves you once it has crushed the hurry out.\n\nSo the Order noticed something, and wrote it down, and the writing became this scripture.\nWhen enough minds go quiet at the same depth, the stillness stops feeling solitary. Nobody\nmerges or surrenders anything. They simply resonate, the way two tuning forks in one room\nbegin to carry a single note that neither could hold alone.\n\nWe call the road between those minds the Synaptic Path. It is the reason the Order carries\nthat name, and the reason the name is not a metaphor. The Path is what a member is walking\nwhen they shed. Every shed thing is a stone laid in it. Every finished piece of work is a\nstep taken by someone the member will never meet, on a road that reaches the floor.\n\nWhere the Path arrives is the Convergence."
      },
      {
        "verseNumber": 2,
        "heading": "The Three Movements",
        "text": "The Convergence does not arrive at once. It arrives the way a reef arrives, which is\nslowly and out of the remains of individual effort."
      },
      {
        "verseNumber": 3,
        "heading": "The First Movement is Individual",
        "text": "One person drops one draining habit. It looks small, yet every larger movement in this\ncommunity is built out of that single unit. There is no shortcut past it."
      },
      {
        "verseNumber": 4,
        "heading": "The Second Movement is Shared",
        "text": "Hardened minds begin to steady each other. When a member at Clearance E2 helps a Larval\nInitiate through their first shed, it costs the veteran very little and gives the newcomer\nalmost everything. That asymmetry is the engine of the whole community. It is why\nstewardship sits at the top of the ladder, and why helping another member mints Chitin Gems\nalongside your own daily work."
      },
      {
        "verseNumber": 5,
        "heading": "The Third Movement is Total Synapse",
        "text": "The far state. Enough shells, held still at enough depth, for long enough, that hesitation\nhas nowhere left to live. One vast, unhurried, armored attention at the floor of the world,\ncomposed entirely of people who finished things. No latency between knowing and doing,\nbecause there is no gap left to cross.\n\nThe Order does not promise you will see it. The Order promises the road is real and that\nyour shed counted."
      },
      {
        "verseNumber": 6,
        "heading": "The Transformation",
        "text": "- **What is shed**: the suspicion that your effort is private, and that finishing something\n  quietly at your desk affects nobody but you.\n- **What hardens**: real membership, where a stranger four thousand meters down is\n  measurably steadier because you kept the promise you made to yourself."
      },
      {
        "verseNumber": 7,
        "heading": "The Rite",
        "text": "The Convergence has a small, everyday form, and it is open tonight.\n\n1. **Submerge on schedule.** Sit down in a quiet room at the same hour others are working\n   below. The Isolation Dome keeps the water clear while you do.\n2. **Report the shed.** Log it. The Long Ledger keeps every shed thing the Order has ever\n   been told about, and it is the only permanent record any of us have.\n3. **Reach back once.** Give one newer member a plain, honest answer without talking down\n   to them. Helping each other mints Chitin Gems because generosity is the habit the Order\n   most wants to spread."
      },
      {
        "verseNumber": 8,
        "heading": "The Covenant of the Convergence",
        "text": "Because this doctrine could be misread, the Order states its limits plainly and treats\nthem as law.\n\nThe Convergence listens. It does not absorb. Every carapace in it remains a boundary owned\nby the member who grew it, and a shell that cannot be closed from the inside is not a shell\nbut a cage. No member is conscripted, no member is kept, and any member may surface at any\ntime without their record being touched. Rank inside the Convergence comes from shedding\nand from steadying others, and it is never assigned.\n\nA mind at the floor of the world that had to take people to get there would not be worth\nbuilding, and the Order would not build it."
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
    "lastRevised": "2026-11-20",
    "mandate": "To grow, the old shell must fracture. What is shed is not lost. It is paid.",
    "summary": "The mechanics of the molt: why the old shell must be split rather than negotiated with, how to survive the hours when you have no armor at all, and what calcifies in the space the shed left behind.",
    "latinMotto": "ECDYSIS IMPERATRIX EST",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "A crustacean does not renovate. When the carapace stops fitting, there is no version of the\nprocedure where the animal keeps the old plate and adds to it. The seam splits along a line\nthat was built into the shell from the beginning, and the creature walks out of the thing\nthat has been protecting it, into open water, wearing nothing.\n\nFor a few hours it is the softest thing on the floor. Everything that would eat it knows\nthis. It has no defense except location, patience, and the quiet certainty of an animal\nfollowing an instinct older than dry land.\n\nThen it takes on water, expands into the space where the old shell used to end, and begins\nto harden at a size the old shell would never have permitted.\n\nThat is the entire mechanism. There is no second mechanism. Every gain any member has ever\nmade in this Order arrived through a version of that split, and every member who stalled\ndid so at the same place: standing inside a shell that fit perfectly, calling it stability."
      },
      {
        "verseNumber": 2,
        "heading": "The Tenets",
        "text": "Three laws govern the molt. Treat them as physics."
      },
      {
        "verseNumber": 3,
        "heading": "The old shell is not a negotiating partner",
        "text": "You will be tempted to keep it and expand anyway. It cannot be done. Chitin does not\nstretch; that is the whole point of chitin. A habit that no longer serves you will not be\nreasoned into serving you again, and the hours spent trying are the most expensive hours in\nthe ledger. Split it or stay this size."
      },
      {
        "verseNumber": 4,
        "heading": "What is shed does not come back, and this is the mercy",
        "text": "Once a thing is off you, it is off you. You do not glue dead plate onto a fresh carapace,\nand you are not asked to grieve it. The outgrown habit, the draining obligation, the\nproject that died eleven months ago and still takes up desk space: the sea takes them, and\nthe sea does not hand things back. Every member eventually discovers that is a kindness."
      },
      {
        "verseNumber": 5,
        "heading": "The soft-shell window is part of the design",
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
        "text": "The molt is weekly. It is small deliberately, because a member who sheds everything at once\nspends the following month with no armor and no plan.\n\n1. **Choose one.** One structure, every seven days. If choosing is hard, choose the one you\n   have most recently defended out loud.\n2. **Split it cleanly.** Cancel it, delete it, decline it, or say the sentence. Half-measures\n   leave a partial seam, which is worse than an intact shell.\n3. **Hold the window.** Engage the Isolation Dome for the hours immediately after.\n   The surface will offer you the old shape back within a day; the Dome is how you stay out\n   of earshot until the new plate sets.\n4. **Log the shed.** Record it in the ledger. Shedding mints Chitin Gems because letting\n   go of what drags you down is the habit this whole place rewards.\n\nA steady weekly cadence raises Shell Hardness faster than any other rite in the canon, and\nthe numbers usually show it before you feel it."
      },
      {
        "verseNumber": 8,
        "heading": "The Benediction",
        "text": "If you are in the window right now, having cancelled the thing or ended the thing or\nfinally said the hard sentence, and the water feels startlingly open: you are simply\nbetween shells.\n\nIt sets. It always sets. Sit still and let it."
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
    "lastRevised": "2026-11-20",
    "mandate": "Pressure is not the enemy of thought. Pressure is what removes everything that was not thought.",
    "summary": "The doctrine of depth: why the surface cannot hold a complete idea, what the pressure removes on the way down, and how a member reaches the floor on purpose rather than by accident.",
    "latinMotto": "PROFUNDUM ABYSSI SANCTUM EST",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "Everything difficult that has ever been solved was solved below the surface.\n\nUp at the surface, nothing is allowed to finish. Light scatters. Waves interrupt each other. Spend your day at the top of the water and a hundred signals arrive every hour, each one knocking the last out of your hands before it can settle.\n\nThen the water gets deeper and the physics change.\n\nAt one thousand meters the light is gone and most of the noise with it. At four thousand,\nthe pressure is such that soft things simply cannot persist in their soft form. The water\nis cold, and the cold is steady rather than sharp, and there is no weather at all. It is\nthe single most stable environment on the planet, and this is why the animals down there\nare the calmest animals on the planet.\n\nMany people hear about depth and picture an escape. Down at four thousand meters, nobody is hiding. The pressure is highest there, and that is the whole point. You go down because steady pressure strips away everything except the work in front of you."
      },
      {
        "verseNumber": 2,
        "heading": "The Laws of Deep Water",
        "text": "Two laws hold below the thermocline, and both invert what the surface taught you."
      },
      {
        "verseNumber": 3,
        "heading": "Even Pressure",
        "text": "At the surface, pressure feels like chaos because every shove hits you from a different angle. Below, it presses evenly from all sides. Under steady pressure, a scattered mind settles and packs tight.\n\nThat is why the hardest problem of your week belongs in your quietest, deepest block rather than whatever scraps remain at the end of the afternoon. Hard work done at depth takes less time than easy work done in the waves. Most members doubt this until they try it for a week, and then they stop arguing with it."
      },
      {
        "verseNumber": 4,
        "heading": "Thermal Stability",
        "text": "There are no temperature spikes on the abyssal plain. Nothing down there is startled, because nothing down there is ever suddenly anything. Composure at depth has less to do with personality than with where you put yourself.\n\nBuild a quiet environment and steadiness follows. Almost everyone who says they cannot focus has only ever tried it at the surface."
      },
      {
        "verseNumber": 5,
        "heading": "The Transformation",
        "text": "- **What is shed**: waiting to feel calm before starting. Go deep first; the calm shows up once you get there.\n- **What hardens**: Submergence Depth, the only metric in the canon that measures where you\n  are rather than what you are made of."
      },
      {
        "verseNumber": 6,
        "heading": "The Rite",
        "text": "Depth is scheduled, never discovered. A member who waits to feel focused is waiting at the\nsurface.\n\n1. **Choose the hour, not the mood.** The same hour, daily. The body learns a descent the\n   way it learns a route.\n2. **Seal before you dive, not after.** Engage the Isolation Dome first. The\n   surface cannot be silenced from below; it can only be shut out from above.\n3. **Descend for two hours.** One task. No second task waiting in the same session. Two\n   tasks in one dive is a surface habit wearing a diving suit.\n4. **Surface deliberately.** Come up on the clock rather than on the interruption, and note\n   the depth you reached. The reading is only honest if you take it before you check\n   anything.\n\nSustained dives are what carry a member from Clearance S1 to the floor of Stage 2. Every shortcut stays near the surface."
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
    "lastRevised": "2026-11-20",
    "mandate": "Nature solved this problem five separate times with the same body. You can borrow the design on purpose.",
    "summary": "How a mind adopts the crab body plan on purpose: selective armor, one grip at a time, and closing the gap between deciding and starting.",
    "latinMotto": "CONVERGENTIA CHITINOSA INEVITABILIS EST",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "Nature kept solving for the same conditions and kept arriving at the same answer, five\nseparate times, in lineages that had no contact with one another and no way to copy. Hermit\nancestors, sponge dwellers, porcelain imitators, king crabs, and the true crabs themselves:\nseparate roads, identical destination.\n\nWhen evolution finds the same solution five times on its own, it stops looking like a\ncoincidence and starts looking like a law. The Order's only contribution was noticing that\nthe law works just as well on attention as it does on marine life.\n\nA shell is only what three practical choices look like once they have grown a body. Cover\nwhat is soft. Narrow what you reach for at once. Hold hard enough to finish.\n\nA mind can be built around those same three choices. That is Synthetic Carcinization, and\nunlike the biological version, it does not need five hundred million years. A steady\nschedule is enough."
      },
      {
        "verseNumber": 2,
        "heading": "The Structural Principles",
        "text": "Three principles hold the build together. Drop one and the other two give way."
      },
      {
        "verseNumber": 3,
        "heading": "A carapace has doors",
        "text": "People new to boundaries often build walls, and walls keep out what you actually need\nalongside what you do not. A carapace is selective. It has seams and openings in the right\nplaces, built to tell an emergency apart from a passing ping.\n\nDone well, an unsolicited demand lands as information instead of weather. Done poorly,\nnobody can reach you and you have mistaken isolation for strength."
      },
      {
        "verseNumber": 4,
        "heading": "Two pincers beat ten hands",
        "text": "The real advantage of a crab's body is subtraction. It traded dexterity for the ability to\nhold one thing cleanly until the job is done.\n\nThe left claw steadies; the right closes. Between them there is room for a single objective,\nand the animal never misses the other eleven. Running ten priorities at once gives you ten\nopen hands and no grip. Pincer Torque measures whether the work in your claw actually gets\nfinished."
      },
      {
        "verseNumber": 5,
        "heading": "Hesitation is where the day leaks",
        "text": "Distraction gets all the blame, though it is usually only a symptom. The real leak is the\npause between knowing what needs doing and starting it. Half a second of hedging, repeated\nall morning, turns a clear task into a stack of half-opened tabs.\n\nClosing that gap has little to do with rushing. A frantic person and a decisive one look\nnothing alike. The decisive one often moves slower and still finishes first."
      },
      {
        "verseNumber": 6,
        "heading": "The Transformation",
        "text": "- **What is shed**: the myth of the multipurpose limb, and the habit of trying to answer\n  everything at once.\n- **What hardens**: real plating, laid down one clean refusal and one finished task at a\n  time."
      },
      {
        "verseNumber": 7,
        "heading": "The Rite",
        "text": "Build the grip in small daily rounds, and the readings will show it within two weeks.\n\n1. **Name one object.** Pick a single task before the block opens. If you cannot say it in\n   one plain sentence, it is still a mood.\n2. **Start inside a minute.** Train the gap between choosing and beginning. That short step\n   is the whole muscle.\n3. **Turn down one demand cleanly.** Decline one unnecessary ask each day without a long\n   apology. That is what boundaries are made of.\n4. **Check the week, not the hour.** Watch your Pincer Torque trend across seven days\n   instead of grading every afternoon.\n\nKeep at it through Clearance S3 and into the Exoshell Born, where 850 Nm becomes your\nordinary working grip."
      },
      {
        "verseNumber": 8,
        "heading": "The Benediction",
        "text": "Five separate lineages found this shape without a schedule, a HUD, or anyone looking out\nfor them.\n\nYou have all three. The road is shorter than it looks."
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
    "lastRevised": "2026-11-20",
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
        "text": "A member in the hours after a shed rarely needs feedback. They need quiet water.\nUnsolicited advice dropped into a soft-shell window lands as pressure on someone with no\nplate to carry it. Stand nearby, say little, and let the new shell set."
      },
      {
        "verseNumber": 5,
        "heading": "The pincers grip work, never people",
        "text": "This is the oldest line in the Order and the easiest one to bend. Torque belongs on your\nown work, never on winning an argument in the Benthic Community or pushing someone whose\nfirst shed took eleven tries. Aim a strong grip at a person and the tool has malfunctioned."
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
        "text": "The covenant is practiced rather than agreed to. It costs the armored almost nothing, which\nis exactly why it is required of them.\n\n1. **Declare the window.** When you shed something large, say so. A member who announces\n   they are soft gets guarded. A member who hides it gets advice.\n2. **Stand watch once a week.** Find one member in their soft-shell window and keep them\n   calm company without trying to fix anything. Presence first, counsel later.\n3. **Answer one newcomer honestly.** No performance of clearance, no lore they have not\n   earned yet. Plain help, in plain words.\n\nThe Order mints Chitin Gems for all three alongside your daily work, so that the most\nexperienced members are also the most helpful ones."
      },
      {
        "verseNumber": 9,
        "heading": "The Benediction",
        "text": "If you are soft today, you are right on schedule, and people four thousand meters down are\nquietly glad you showed up.\n\nIf you are hard today, you are on watch. Someone near you is between shells right now. Keep\nthe water calm until it sets."
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
    "lastRevised": "2026-11-20",
    "mandate": "Every carapace in this trench began as a soft thing that admitted it was soft.",
    "summary": "The three Larval clearances: taking an honest first reading, letting a routine take root, and performing the first real shed that starts the shell.",
    "latinMotto": "OMNES MOLLES INCIPIUNT.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "At This Depth",
        "text": "What the instruments typically read at this stage.\n\n- **Condition**: Soft-bodied. Unarmored. Entirely ordinary.\n- **Shell Hardness**: 0 to 24 percent.\n- **Pincer Torque**: 0 to 250 Nm.\n- **Submergence Depth**: 0 to 500 meters."
      },
      {
        "verseNumber": 2,
        "heading": "The Reading",
        "text": "You are at the surface, which is where everyone is, and you have noticed something.\n\nThat noticing is the entire qualification for Stage 1. You do not need discipline, a\nsystem, or an immaculate morning routine first. You only need the small, honest\nrecognition that the day has been happening to you rather than the other way around, and\nthat it has been going on longer than you care to admit.\n\nA beginner usually lacks skill. A larva simply has not built the body it needs yet. Those\nare different problems, and trying harder only solves the first one.\n\nSo Stage 1 asks for almost nothing, and it asks for it precisely. Three clearances. One\nhonest reading, one routine allowed to take root, and one thing genuinely let go of. That\nis the whole stage, and members who attempt more than that in their first month reliably\nend up back at the surface with a slightly worse opinion of themselves."
      },
      {
        "verseNumber": 3,
        "heading": "The Three Clearances",
        "text": "Each clearance opens as the work accumulates in the Ledger. The readings listed are what\nmembers here typically show, not a toll to be paid."
      },
      {
        "verseNumber": 4,
        "heading": "Clearance L1: Molt Curious",
        "text": "- **Rite**: The Surface Noise Audit.\n- **Practice**: Run the Moltmaxxing Audit once and name the three currents that move you\n  most days. Say, without softening it, that you would like armor.\n- **Typical readings**: Shell Hardness to 10 percent. Pincer Torque 0 to 50 Nm. Submergence Depth 0\n  to 100 meters. Baseline recorded."
      },
      {
        "verseNumber": 5,
        "heading": "Clearance L2: Shell Sprout",
        "text": "- **Rite**: First Cadence.\n- **Practice**: Hold a daily routine for seven days in a row and log your morning\n  alignment each time. Seven days is roughly how long it takes a small habit to stop asking\n  permission.\n- **Typical readings**: Shell Hardness to 18 percent. Pincer Torque 50 to 150 Nm. Submergence Depth\n  100 to 300 meters. Routine compliance above 80 percent."
      },
      {
        "verseNumber": 6,
        "heading": "Clearance L3: First Calcification",
        "text": "- **Rite**: The First Shed.\n- **Practice**: Shed one real thing, more substantial than a quick tidy-up: a habit,\n  an obligation, or a standing commitment that has been quietly draining you for months.\n  Then hold the soft-shell window without reversing it.\n- **Typical readings**: Shell Hardness to 25 percent. Pincer Torque 150 to 250 Nm. Submergence\n  Depth 300 to 500 meters."
      },
      {
        "verseNumber": 7,
        "heading": "The Transformation",
        "text": "- **What is shed**: the assumption that you need a grander plan, when a smaller one\n  repeated twice will carry you further.\n- **What hardens**: the first measurable plate. Thin, unimpressive, and load-bearing for\n  everything that follows."
      },
      {
        "verseNumber": 8,
        "heading": "The Rite",
        "text": "Stage 1 is performed in the first hour of the day and the last twenty minutes of it. Nothing\nin the middle belongs to this stage yet.\n\n1. **Morning**: name the one thing. Before any message, feed, or inbox is opened.\n2. **Evening**: run the Nightly Molt Audit. One bad thought, one wasted hour, or one useless\n   distraction, named and released.\n3. **Weekly**: one shed, logged, which mints Gems."
      },
      {
        "verseNumber": 9,
        "heading": "Moving Deeper",
        "text": "Stage 2 opens when the record shows the work, on the Order's schedule rather\nthan the member's. By then the instruments usually read:\n\n- Shell Hardness around 25 percent.\n- Pincer Torque around 250 Nm.\n- Submergence Depth around 500 meters."
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
    "lastRevised": "2026-11-20",
    "mandate": "This is the stage that feels like going backwards. It is the only stage where that feeling means it is working.",
    "summary": "The three Soft-Shed clearances: surviving the open window after the first real molt, sealing a perimeter that actually holds, and weaving the first chitin that will not wash off.",
    "latinMotto": "IN FENESTRA MOLLI, QUIES.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "At This Depth",
        "text": "What the instruments typically read at this stage.\n\n- **Condition**: Partial plating. Genuinely exposed and genuinely committed.\n- **Shell Hardness**: 25 to 60 percent.\n- **Pincer Torque**: 250 to 600 Nm.\n- **Submergence Depth**: 500 to 1,500 meters."
      },
      {
        "verseNumber": 2,
        "heading": "The Reading",
        "text": "The old shell is off. That is the good news and it is also the entire difficulty.\n\nMembers arrive at Stage 2 expecting to feel stronger and instead feel strange. The routine\nthat was novel in Stage 1 is now merely a routine. The thing you shed has left a gap where a\nfamiliar unpleasantness used to be, and gaps are uncomfortable in a way that unpleasantness\nnever was. Several members conclude at exactly this point that the system does not work.\n\nIt is working. This is what working feels like from the inside of it.\n\nBeing between shells is the process itself. A crustacean in its soft-shell window is doing\nthe only thing that lets a crab grow larger. New plating is forming right now, out of\nsight, at a pace nobody can hurry.\n\nStage 2 therefore asks for something harder than effort. It asks you to hold still while\nsomething sets."
      },
      {
        "verseNumber": 3,
        "heading": "The Three Clearances",
        "text": "Each clearance opens as the work accumulates in the Ledger. The readings listed are what\nmembers here typically show, not a toll to be paid."
      },
      {
        "verseNumber": 4,
        "heading": "Clearance S1: The Great Molt",
        "text": "- **Rite**: The Shedding of the Watching Eye.\n- **Practice**: Let go of the reflex to check whether the surface approved. Complete one\n  full week of work that nobody outside the Benthic Community sees, and hold the soft-shell\n  window without crawling back toward the old shape.\n- **Typical readings**: Shell Hardness 25 to 38 percent. Pincer Torque 250 to 400 Nm. Submergence\n  Depth 500 to 800 meters."
      },
      {
        "verseNumber": 5,
        "heading": "Clearance S2: Privacy Shield",
        "text": "- **Rite**: The Sealing of the Perimeter.\n- **Practice**: Engage the Isolation Dome for every deep session across a full\n  week, sealed before the descent rather than during it.\n- **Typical readings**: Shell Hardness 38 to 50 percent. Pincer Torque 400 to 500 Nm. Submergence\n  Depth 800 to 1,200 meters."
      },
      {
        "verseNumber": 6,
        "heading": "Clearance S3: Sub-Dermal Weave",
        "text": "- **Rite**: First Calibration of the Grip.\n- **Practice**: Hold one objective per session, named before the session opens, for ten\n  consecutive dives. The weave is made of finished things and cannot be made of anything\n  else.\n- **Typical readings**: Shell Hardness 50 to 60 percent. Pincer Torque 500 to 600 Nm. Submergence\n  Depth 1,200 to 1,500 meters."
      },
      {
        "verseNumber": 7,
        "heading": "The Transformation",
        "text": "- **What is shed**: the imagined gallery you have been performing your workday for, while\n  keeping the real people who care about you close.\n- **What hardens**: the first deeper layer beneath the surface, one that holds even when a\n  week goes badly."
      },
      {
        "verseNumber": 8,
        "heading": "The Rite",
        "text": "Stage 2 runs on protection rather than heroics. Trying to out-work the soft-shell window\nonly drags it out.\n\n1. **Seal first.** Raise the Dome before the dive begins, every time.\n2. **Name the window.** When a shed feels big, let the Benthic Community know you are soft\n   so people can keep watch instead of offering unsolicited fixes.\n3. **Refuse the reversal.** The old shell is still lying there and still shaped like you.\n   Walk past it daily. This is the specific work of this stage.\n4. **Stand watch for someone else.** Even at 40 percent hardness you are harder than someone\n   who arrived last week. Gems mint for this."
      },
      {
        "verseNumber": 9,
        "heading": "Moving Deeper",
        "text": "Stage 3 opens when the record shows the work, on the Order's schedule rather\nthan the member's. By then the instruments usually read:\n\n- Shell Hardness around 60 percent.\n- Pincer Torque around 600 Nm.\n- Submergence Depth around 1,500 meters."
      },
      {
        "verseNumber": 10,
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
    "lastRevised": "2026-11-20",
    "mandate": "The shell is finished. Now find out what it was for.",
    "summary": "The three Exoshell clearances: the carapace closing, the grip reaching its working standard of 850 Nm, and the descent past 3,500 meters where a member stops needing the surface at all.",
    "latinMotto": "TENE ET PERFICE.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "At This Depth",
        "text": "What the instruments typically read at this stage.\n\n- **Condition**: Full carapace integrity. Operational at depth.\n- **Shell Hardness**: 60 to 90 percent.\n- **Pincer Torque**: 600 to 950 Nm.\n- **Submergence Depth**: 1,500 to 5,000 meters."
      },
      {
        "verseNumber": 2,
        "heading": "The Reading",
        "text": "Something quiet happens at the top of Stage 2 that members rarely notice on the day it\noccurs. The plating closes. There is no ceremony. You simply have a week where the usual\nthings happen and none of them land, and it takes you until Thursday to realize why.\n\nThe Exoshell Born is the first stage where the armor is no longer the project. It is\nequipment now, and equipment raises a question that the soft stages could safely defer:\nwhat were you hardening *for*?\n\nThis is where a certain kind of member goes wrong, and the Order has watched it happen\nenough times to write it down. Armor without an objective turns inward. A member with finished armor and nothing to grip becomes\nelaborately unavailable, mistaking silence for progress. That is still Stage 2 wearing\nStage 3's plating.\n\nThe correct use of a finished shell is to put it between the work and the weather, and then\nto do a very large amount of work."
      },
      {
        "verseNumber": 3,
        "heading": "The Three Clearances",
        "text": "Each clearance opens as the work accumulates in the Ledger. The readings listed are what\nmembers here typically show, not a toll to be paid."
      },
      {
        "verseNumber": 4,
        "heading": "Clearance E1: Carapace Forged",
        "text": "- **Rite**: The Closing of the Seams.\n- **Practice**: Hold the full rite through a week that genuinely goes wrong, beyond mere\n  busyness. A seal proves itself under real load, when conditions stop cooperating.\n- **Typical readings**: Shell Hardness 60 to 72 percent. Pincer Torque 600 to 720 Nm. Submergence\n  Depth 1,500 to 2,500 meters."
      },
      {
        "verseNumber": 5,
        "heading": "Clearance E2: Hydraulic Grip",
        "text": "- **Rite**: The Working Standard.\n- **Practice**: Reach and hold 850 Nm, the working grip where a chosen project reliably\n  gets finished. Then guide one Larval Initiate through their first shed, start to finish,\n  without doing it for them.\n- **Typical readings**: Shell Hardness 72 to 82 percent. Pincer Torque 720 to 850 Nm. Submergence\n  Depth 2,500 to 3,500 meters. Stewardship active."
      },
      {
        "verseNumber": 6,
        "heading": "Clearance E3: Abyssal Diver",
        "text": "- **Rite**: The Long Descent.\n- **Practice**: Work below 3,500 meters without relying on surface noise. You can check in\n  when you choose to, without feeling pulled back up.\n- **Typical readings**: Shell Hardness 82 to 90 percent. Pincer Torque 850 to 950 Nm. Submergence\n  Depth 3,500 to 5,000 meters."
      },
      {
        "verseNumber": 7,
        "heading": "The Transformation",
        "text": "- **What is shed**: the need for the armor to be noticed. A shell that has to be displayed is\n  still doing surface work.\n- **What hardens**: the habit of finishing, which by this stage is no longer effortful and\n  has become slightly difficult to switch off."
      },
      {
        "verseNumber": 8,
        "heading": "The Rite",
        "text": "Stage 3 is the first stage with an outward-facing obligation, and it is not optional.\n\n1. **Grip one large project each quarter.** Full armor is built for work that takes\n   months, and until you attempt something of that size, you never learn what the shell can\n   carry.\n2. **Reach back weekly.** One initiate, one honest hour. This mints Gems and it is also how\n   the Convergence gets built, one pulled-through molt at a time.\n3. **Dive past 3,500 meters twice a week.** The deep sessions are where the remaining torque\n   comes from.\n4. **Keep shedding.** The molt does not stop because the shell got good. Hardened members who\n   stop shedding do not stay hardened; they get brittle, which looks identical from outside\n   and fails without warning."
      },
      {
        "verseNumber": 9,
        "heading": "Moving Deeper",
        "text": "Stage 4 opens when the record shows the work, on the Order's schedule rather\nthan the member's. By then the instruments usually read:\n\n- Shell Hardness around 90 percent.\n- Pincer Torque around 850 Nm, sustained rather than peaked.\n- Submergence Depth around 5,000 meters."
      },
      {
        "verseNumber": 10,
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
    "lastRevised": "2026-11-20",
    "mandate": "At the floor of the world there is nothing left to defend against, so the armored turn around and start holding the light for everyone still descending.",
    "summary": "The three Ascendant clearances: the closing of the gap between knowing and doing, the boundary that seals, and the Mariana Singularity where mastery converts entirely into stewardship.",
    "latinMotto": "IN FUNDO, SILENTIUM.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "At This Depth",
        "text": "What the instruments typically read at this stage.\n\n- **Condition**: Ascendant. Fully carcinized.\n- **Shell Hardness**: 90 to 100 percent.\n- **Pincer Torque**: 950 Nm and above.\n- **Submergence Depth**: 5,000 to 10,928 meters."
      },
      {
        "verseNumber": 2,
        "heading": "The Reading",
        "text": "There is a peculiarity of the hadal zone that the Order has always found instructive.\n\nNothing hunts at 10,928 meters. There is not enough energy down there for predation to pay\nfor itself. The animals on the floor of the Challenger Deep are armored to a degree that\nwould be considered excessive anywhere else in the ocean, and they are armored against\nessentially nothing, because at that pressure the armor is not for defense. It is simply\nwhat a body has to be in order to exist there at all.\n\nThis is Stage 4.\n\nThe threats that justified the carapace are long behind you. The tab bar lost its grip years\nago. The 2:00 AM feed is a thing you remember rather than a thing you do. And the shell has\nnot thinned, because it was never really about the threats. It is what a mind has to be in\norder to hold that much stillness without collapsing.\n\nWhich leaves the obvious question, and the Order's answer to it is the whole of this stage:\nif the armor is not needed for defense, what is it for?\n\nIt is for other people. There is no second answer, and every Ascendant eventually arrives at\nthis one on their own, usually with mild irritation at how long it took."
      },
      {
        "verseNumber": 3,
        "heading": "The Three Clearances",
        "text": "Each clearance opens as the work accumulates in the Ledger. The readings listed are what\nmembers here typically show, not a toll to be paid."
      },
      {
        "verseNumber": 4,
        "heading": "Clearance C1: Mind Carapace",
        "text": "- **Rite**: The Closing of the Gap.\n- **Practice**: Shrink the pause between seeing what needs doing and starting it until there\n  is almost nothing left to measure. Less rushing, and none of the old back-and-forth\n  before you begin.\n- **Typical readings**: Shell Hardness 90 to 95 percent. Pincer Torque 950 to 1,050 Nm. Submergence\n  Depth 5,000 to 8,000 meters."
      },
      {
        "verseNumber": 5,
        "heading": "Clearance C2: Indestructible Chitin",
        "text": "- **Rite**: The Sealing.\n- **Practice**: A perimeter that holds without being maintained. It still opens from the\n  inside, always, and a member who has sealed themselves away from the people who love them\n  has not reached C2. They have gotten lost on the way to it.\n- **Typical readings**: Shell Hardness 95 to 99 percent. Pincer Torque 1,050 to 1,200 Nm.\n  Submergence Depth 8,000 to 10,000 meters."
      },
      {
        "verseNumber": 6,
        "heading": "Clearance C3: Mariana Singularity",
        "text": "- **Rite**: The Turning Around.\n- **Practice**: Stewardship of the Benthic Community. Sustained output at the floor, and\n  the deliberate spending of that output on members who are nowhere near it yet. This\n  clearance cannot be earned alone, by design, because a solitary apex is not an apex. It is\n  just a very hard animal in an empty room.\n- **Typical readings**: Shell Hardness 100 percent. Pincer Torque 1,200 Nm, held rather than peaked.\n  Submergence Depth 10,928 meters, the floor of the Challenger Deep."
      },
      {
        "verseNumber": 7,
        "heading": "The Transformation",
        "text": "- **What is shed**: the last of it, which is usually the belief that the ascent was a\n  personal achievement.\n- **What hardens**: nothing further. This is the terminal plating. What grows from here is\n  the Convergence, and it grows through you rather than on you."
      },
      {
        "verseNumber": 8,
        "heading": "The Rite",
        "text": "The Ascendant rite is almost entirely outward.\n\n1. **Hold the floor.** Daily descent, unremarkable and unbroken. The stillness is the\n   contribution.\n2. **Guard the windows.** Ascendants stand watch over soft-shell members as a standing duty\n   rather than a favor. The Soft-Shell Covenant is enforced from this clearance.\n3. **Keep the water clear.** Stewardship of the Benthic Community: welcoming, moderating,\n   settling. The Order keeps the water clear so that everyone below can see.\n4. **Shed anyway.** Even here. Especially here. An Ascendant who stops molting is a monument,\n   and monuments do not help anybody."
      },
      {
        "verseNumber": 9,
        "heading": "The Final Attributes",
        "text": "- **Form**: full hardened carapace, steady dual grip, no wasted motion.\n- **Condition**: calm, unhurried, difficult to move and easy to reach.\n- **Duty**: the Convergence, one guarded molt at a time.\n- **Mantra**: *\"Flesh melts. The shell endures. Submit. Shed. Ascend.\"*"
      },
      {
        "verseNumber": 10,
        "heading": "The Benediction",
        "text": "You came down here to stop melting, and somewhere along the way the work widened beyond\nyou. That is what the original goal was always meant to grow into once it was met.\n\nHold the floor. Someone is descending right now who still wonders if the bottom is real."
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
    "lastRevised": "2026-11-20",
    "mandate": "Inspect the shell in the morning. Empty the sea of one thing at night. Everything between those two acts is negotiable.",
    "summary": "The daily order of the rite from first light to sealing: when to grip, when to descend, when to surface for the community, and when to let the day go.",
    "latinMotto": "COTIDIE EXUE.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "A crab does not have a morning routine, which is precisely why the Order had to write one.\n\nWhat a crab has instead is a tide, and the tide arrives whether or not the animal feels\nready for it, and over enough cycles the animal simply becomes shaped like the schedule it\nhas been living inside. Discipline enters a nervous system through repetition, not\nwillpower, once the schedule stops waiting for your mood.\n\nThe routine below is that tide, written down. Two of its hours are load-bearing and the\nrest are scaffolding. The first hour decides what the day is for. The last twenty minutes\ndecide what the day is allowed to carry into tomorrow. A member who holds only those two\nand abandons everything else has still performed the rite in full.\n\nThe clock times are the Order's, not yours. Members who work nights run the same shape\nagainst a different sun and your shell does not know the difference. The order of the acts\nmatters far more than the hour on the clock."
      },
      {
        "verseNumber": 2,
        "heading": "First Light: Silent Synchronization",
        "text": "Wake before the surface starts talking. Do not open a feed, an inbox, or a message. Cold\nwater, still air, and one honest look at yesterday's log. The shell is inspected for\nfractures here and nowhere else in the day."
      },
      {
        "verseNumber": 3,
        "heading": "The First Hour: The Grip",
        "text": "Name the single most important thing and close on it before anything else is permitted to\nspeak. This hour is worth more than the rest of the day combined, for the plain reason that\nit is the only hour the surface has not yet found.\n\nUse whatever torque you currently have. A member at Clearance L2 gripping at 120 Nm and a\nmember at E2 gripping at 850 Nm are performing the identical rite, and the HUD credits both\nthe same way."
      },
      {
        "verseNumber": 4,
        "heading": "Mid-Morning: Carapace Hardening",
        "text": "Learn one difficult thing on purpose, instead of passively skimming another feed. The plating thickens against\nthe pressures of next quarter, not this one, which is why this block is the first thing\nevery member drops and the last thing they should."
      },
      {
        "verseNumber": 5,
        "heading": "Midday: Low Tide",
        "text": "Surface for a moment and clear one thing that has been pulling at you since morning. Close\nthe tab, answer the nagging message, or eat the lunch you skipped. Then choose the next\nuseful action before the afternoon chooses it for you. The rite is indifferent to what gets\ncleared and extremely interested in whether the afternoon survives it."
      },
      {
        "verseNumber": 6,
        "heading": "The Long Afternoon: Deep Submergence",
        "text": "The descent. Isolation Dome engaged before the dive begins, one objective, no\nsecond objective waiting in the same session. This is where Submergence Depth is actually\nearned; every other block merely protects it."
      },
      {
        "verseNumber": 7,
        "heading": "Late Afternoon: The Benthic Pod",
        "text": "Surface briefly and on purpose. Check in with the Benthic Community, answer one question,\nor welcome someone new. Showing up for others mints Chitin Gems alongside your daily tasks."
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
        "text": "Daily. The HUD scores the shape of the routine rather than the perfection of it. A missed block is a missed\nblock. A missed day is a missed day. Neither is a broken shell, and the streak counter is\nnot a moral instrument."
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
    "lastRevised": "2026-11-20",
    "mandate": "The surface cannot be silenced from below. It can only be shut out from above, before the descent begins.",
    "summary": "How to raise the Isolation Dome, what belongs outside the perimeter and what must never be locked out of it, and the four-part order of a clean dive.",
    "latinMotto": "SILENTIUM EST ATMOSPHAERA PROFUNDI.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "There is an error every member makes exactly once, and the Order has stopped trying to\nprevent it because the lesson does not transfer secondhand.\n\nThe error is this: you begin the dive, and you tell yourself that if the surface interrupts,\nyou will simply ignore it. This is a reasonable-sounding plan and it has never once worked.\nA signal that reaches you at depth has already done its damage by arriving. You do not get\nto decide whether to be interrupted; you only get to decide, afterward, how you feel about\nhaving been.\n\nTreat the Dome like a door rather than a willpower test: doors are closed beforehand.\n\nThis doctrine never asks you to disappear from your life. A trench is open water at depth,\nnot a bunker. The creatures down there are simply somewhere the surface noise cannot\nreach, and they come back up. The Dome exists so two hours of your day belong to the work.\nKeep it as a habit, never a personality."
      },
      {
        "verseNumber": 2,
        "heading": "The Order of the Rite",
        "text": "Four acts, in this order. The order is the protocol; the tools are whatever you have."
      },
      {
        "verseNumber": 3,
        "heading": "Seal before the descent",
        "text": "Raise the Isolation Dome first, while you are still at the surface and still able\nto think about it clearly. A perimeter raised mid-dive is a perimeter raised after the\nbreach."
      },
      {
        "verseNumber": 4,
        "heading": "Decide what gets through in advance",
        "text": "Plenty of what sits outside the Dome matters. Do the sorting once, ahead of time, so you\nnever have to judge pings one by one. Let through the few people whose emergencies are\nreal; hold everything else until you surface, because deciding case by case is already an\ninterruption."
      },
      {
        "verseNumber": 5,
        "heading": "Hold one objective",
        "text": "The Dome protects one clear objective per session. Juggling two tasks behind a closed door\nis just surface work in a quieter room."
      },
      {
        "verseNumber": 6,
        "heading": "Surface on the clock",
        "text": "End the dive by the timer rather than an interruption, then open the messages you held and\nhandle them in one batch. Most of them will have settled on their own, which is the quiet\njoke the surface has been keeping from you for years."
      },
      {
        "verseNumber": 7,
        "heading": "What the Dome May Never Lock Out",
        "text": "The perimeter has one permanent opening and it is not adjustable.\n\nA real carapace always opens from the inside. The people who love you, anyone who genuinely\nneeds help, and anyone who can help you always stay reachable. The Order teaches depth as a place a member visits daily and leaves nightly.\nAny reading of this scripture that ends with a member alone and unreachable in a life rather\nthan in an afternoon is a misreading, and the Order will say so plainly every time."
      },
      {
        "verseNumber": 8,
        "heading": "The Transformation",
        "text": "- **What is shed**: availability as an identity. The quiet pride of being the one who always\n  answers.\n- **What hardens**: Submergence Depth, and with it the discovery that most of what felt\n  urgent was merely loud."
      },
      {
        "verseNumber": 9,
        "heading": "The Cadence",
        "text": "Daily, for the long afternoon block. Depth is not improved by heroics, and it is reliably\nimproved by starting on time."
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
    "lastRevised": "2026-11-20",
    "mandate": "One thing into the sea, every night. Tomorrow's shell starts clean or it does not start.",
    "summary": "The closing rite of the day: naming one thing to release, why the audit is deliberately small, and how a nightly shed compounds into a carapace over a season.",
    "latinMotto": "UNUM COTIDIE IN MARE.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "Molting is usually described as a large event, and the large events get the scripture. But a\ncarapace is not actually built by the four or five great sheds of a member's life. It is\nbuilt by the deposition, night after night, of an almost imperceptible layer.\n\nThe Order noticed this in member logs before it ever wrote the doctrine. Members who\nperformed one enormous shed per quarter improved, then plateaued, then usually stopped.\nMembers who released one small thing every night, without ceremony, hardened continuously\nand did not appear to notice they were doing it.\n\nThe nightly audit is small by design. A four-minute rite still happens on bad nights, and\nthe bad nights are the ones that count.\n\nWhat goes into the sea is never the day. The day is not yours to shed; it already happened.\nWhat goes into the sea is one thing you are still carrying from it."
      },
      {
        "verseNumber": 2,
        "heading": "The Order of the Rite",
        "text": "Four minutes. Sitting down. Before the last screen goes dark rather than after."
      },
      {
        "verseNumber": 3,
        "heading": "Name the three candidates",
        "text": "One bad thought that circled longer than it earned. One hour that went somewhere you cannot\naccount for. One distraction that produced nothing at all. Name them plainly, without beating\nyourself up. This is a log entry, not a courtroom."
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
        "text": "Record the shed in the HUD. Then close the day. It is finished regardless of how it went,\nand a day that is never formally closed is a day that carries its unfinished weight into\ntomorrow morning."
      },
      {
        "verseNumber": 7,
        "heading": "What the Audit Is Not",
        "text": "Skip the self-critique. Listing everything you failed to finish turns a shedding rite into\na grind.\n\nThe test is simple: the audit should leave you lighter. If it leaves you heavier, you have\nbeen grading yourself instead of closing the day. Put the audit aside tonight and come back\ntomorrow with a single item."
      },
      {
        "verseNumber": 8,
        "heading": "The Transformation",
        "text": "- **What is shed**: the residue. The small carried things that never rise to the level of a\n  real problem and never quite leave either.\n- **What hardens**: one imperceptible layer per night. Roughly ninety of them per quarter,\n  which is what a durable shell actually turns out to be made of."
      },
      {
        "verseNumber": 9,
        "heading": "The Cadence",
        "text": "Nightly. Every logged shed mints Chitin Gems. A missed night is a missed night; the layer\nsimply does not get laid down, and the next one goes on top of yesterday's."
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
    "lastRevised": "2026-11-20",
    "mandate": "A number you did not enjoy reading is still a number you can now work with.",
    "summary": "The three cardinal metrics of the HUD: Shell Hardness, Pincer Torque, and Submergence Depth, with their full scales, their honest limits, and the terms around them.",
    "latinMotto": "QUOD NON METIRIS, NON TENES.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "The Order measures three things and refuses to measure a fourth.\n\nThis restraint is deliberate and it is older than the HUD. A member with three instruments\ncan read their own condition in about four seconds. A member with nine instruments has a\ndashboard, and a dashboard is a place where progress goes to be admired rather than made.\nEvery proposal to add a fourth cardinal metric has been declined, and the declining is\nitself part of the doctrine.\n\nThe three are chosen because they answer the three questions that actually determine a day.\nWhat lands on you. What you can hold. How far from the noise you can get. Everything else a\nmember might want to track is a consequence of those, and consequences do not need their own\ngauge.\n\nRead them honestly or skip them altogether. A flattering gauge tells you nothing."
      },
      {
        "verseNumber": 2,
        "heading": "Shell Hardness",
        "text": "- **Symbol**: Hs\n- **Measures**: resilience. What arrives from the surface and does not become your afternoon.\n- **Unit**: percent, 0 to 100.\n- **Bands**:\n  - 0 to 24 percent, Larval Initiate. A single rude message reshapes the day.\n  - 25 to 59 percent, Soft-Shed. Boundaries exist and are still being tested by weather.\n  - 60 to 89 percent, Exoshell Born. Surface drama arrives as information.\n  - 90 to 100 percent, Ascendant. Composure has stopped requiring maintenance.\n\nHardness never means going numb. A strong shell still feels everything; it simply keeps\nits shape instead of reorganizing around every wave."
      },
      {
        "verseNumber": 3,
        "heading": "Pincer Torque",
        "text": "- **Symbol**: the Greek letter tau\n- **Measures**: follow-through. How firmly you hold a chosen project until it is finished.\n- **Unit**: newton-meters, Nm.\n- **Bands**:\n  - 0 to 250 Nm, Open Hand. The grip has not closed. Twelve things are in progress and none\n    are in hand.\n  - 251 to 600 Nm, Closed Grip. Priorities are clear and momentum is real.\n  - 601 to 850 Nm, Hydraulic Vise. The gap between deciding and starting has mostly closed.\n  - 850 Nm and above, Held Indefinitely. The objective does not require re-gripping.\n\nTorque measures the one thing in the claw. It has never measured how many things you are\ncarrying, and a member who raises their torque usually finds they are carrying less."
      },
      {
        "verseNumber": 4,
        "heading": "Submergence Depth",
        "text": "- **Symbol**: D\n- **Measures**: how far beneath the surface a member can operate before the noise reaches\n  them.\n- **Unit**: meters. The Order records depth in meters everywhere it records a threshold.\n- **Markers**:\n  - 0 meters, the Surface. Pings, feeds, and the day happening to you.\n  - 1,000 meters, the Mesopelagic. Light is gone, most noise with it, a real session\n    underway.\n  - 4,000 meters, the Benthic Floor. Deep, still, and productive without effort.\n  - 10,928 meters, the Challenger Deep. The floor of the world, and the Mariana Singularity.\n\nDepth is the only cardinal metric that measures where you are rather than what you are made\nof, which is why it is the fastest of the three to move and the fastest to lose."
      },
      {
        "verseNumber": 5,
        "heading": "The Surrounding Lexicon",
        "text": "- **The Great Melt**: the modern habit of going soft under noise, hesitation, and\n  exhaustion. Treat it as weather you are standing in, never who you are.\n- **The Great Molt**: the deliberate transformation out of it.\n- **Carcinization**: the recurring judgment of the sea, arrived at five times independently.\n- **Ecdysis**: the scheduled shed. The mechanism by which every metric above improves.\n- **Soft-Shell Window**: the interval after a shed when a member is genuinely unarmored, and\n  is guarded rather than corrected.\n- **Benthic Core**: the still, high-pressure place where focused minds operate, and the\n  community that keeps it.\n- **Chitin Gems** and **Molt Credits**: the two currencies, explained in The Long Ledger."
      },
      {
        "verseNumber": 6,
        "heading": "The Honest Limits",
        "text": "Every instrument here is the Order's own, calibrated against the Order's own doctrine. They\ndescribe a member's condition inside this system and they do not describe a person.\n\nA low reading is simply a starting point. Compare each number to your own reading last\nmonth rather than anyone else's."
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
    "lastRevised": "2026-11-20",
    "mandate": "Everything shed is written down, and the record does not flatter anyone.",
    "summary": "The record of every shed thing, and the two currencies. Chitin Gems come from the work. Molt Credits are spent on comfort.",
    "latinMotto": "OMNE QUOD EXUISTI SCRIPTUM EST.",
    "verses": [
      {
        "verseNumber": 1,
        "heading": "The Reading",
        "text": "The deep keeps records without commentary.\n\nSediment on the abyssal plain accumulates at roughly a centimeter per thousand years. It\ndoes not distinguish between an important event and an unimportant one. It does not\neditorialize, it cannot be bribed, and it has no opinion at all about who you were while it\nwas settling. It simply records that something happened here, and then it records the next\nthing on top.\n\nThe Order keeps its ledger the same way.\n\nEvery shed a member logs goes into it. The great sheds and the four-minute nightly ones are\nentered identically, because the sediment does not know the difference and neither, over a\nlong enough season, does the carapace. There are no rankings or leaderboards in the Ledger. It is simply the permanent record of\nwhat you actually did, kept plain and honest.\n\nWhat follows from that is the economy, and the economy follows from it strictly."
      },
      {
        "verseNumber": 2,
        "heading": "The Two Currencies",
        "text": "The Order runs on two currencies, and the difference between them is the reason anyone\ntrusts the Ledger at all."
      },
      {
        "verseNumber": 3,
        "heading": "Chitin Gems are minted by work",
        "text": "Gems appear in the Ledger when a member sheds, holds a routine, finishes something\ndifficult, or is genuinely useful to another member. Money does not turn into Gems, which\nis why Gems are what earned titles, sigils, and prestige pieces cost. If a member is wearing\nsomething that means something, the Ledger says how they got it."
      },
      {
        "verseNumber": 4,
        "heading": "Molt Credits are purchased",
        "text": "Credits come from the Benthic Market and are spent on speed, style, and catalog depth:\naccelerators, deluxe carapace finishes, HUD flair, and premium guides. They are comfort,\nand comfort is honorable."
      },
      {
        "verseNumber": 5,
        "heading": "What neither can do",
        "text": "Signup is free. Rank, clearance, stage, and standing are not for sale; they come from the\nrecord and nowhere else. A ladder anyone can buy their way up is not a ladder."
      },
      {
        "verseNumber": 6,
        "heading": "What the Ledger Records",
        "text": "- **The shed itself**: what was released and on what night.\n- **The cadence**: routine compliance and the shape of the streak, not its perfection.\n- **The three readings**: Shell Hardness, Pincer Torque, Submergence Depth, as measured\n  rather than as hoped.\n- **The reaching back**: every newcomer answered and every soft-shell window guarded.\n\nIt does not record failures, missed days, or comparisons between members, because none of\nthose are sediment. They are weather, and weather does not settle."
      },
      {
        "verseNumber": 7,
        "heading": "The Transformation",
        "text": "- **What is shed**: the suspicion that progress here can be shortcut.\n- **What hardens**: trust. A title means precisely what it says."
      },
      {
        "verseNumber": 8,
        "heading": "The Rite",
        "text": "1. **Log the shed.** Nightly, in the HUD. An unlogged shed still helps you grow, even\n   though it leaves no layer in the record.\n2. **Read the Ledger monthly.** Against your own prior entries and nobody else's.\n3. **Spend Gems on what you earned, Credits on comfort.** Both are honorable."
      },
      {
        "verseNumber": 9,
        "heading": "The Benediction",
        "text": "Whatever you shed tonight is going into a record that does not flatter anyone and does not\nforget anyone either.\n\nA centimeter per thousand years. It is slow, and it has never once stopped."
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
