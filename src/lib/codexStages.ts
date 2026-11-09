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
        "requirement": "Shed one real thing, then hold the soft-shell window without reversing it.",
        "metricThreshold": "Shell Hardness 18% - 25%",
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
    "subtitle": "Active moulting state focusing on sub-dermal chitin growth, and deep work shielding.",
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
        "requirement": "Engage the Isolation Dome for every deep session across a full week, sealed before the descent rather than during it.",
        "metricThreshold": "Shell Hardness 38% - 50%",
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
