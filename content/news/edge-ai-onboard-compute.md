---
title: "12.5 TOPS in a Palm-Sized Board: What Edge AI Still Has to Prove on Robots"
slug: "edge-ai-onboard-compute"
summary: "Lantronix's Spotter board puts up to 12.5 TOPS of edge AI onto drones and robots at single-digit watts. Real autonomy still depends on heat, battery sag, and integration."
category: "TELEMETRY"
tags:
  - "edge AI"
  - "Robotics Hardware"
  - "Physical AI"
authorName: "Silas Trench"
authorRole: "Senior Benthic Telemetry Correspondent"
coverImageUrl: "https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/blog/edge-ai-onboard-compute-cover-v2.png"
readTimeMinutes: 4
isFeatured: true
isPublished: true
publishedAt: "2026-10-15T19:47:00-04:00"
---

### A spec sheet does not carry a battery

A 42 by 120 millimeter circuit board fits easily across the palm of your hand. On paper, Lantronix's new Spotter module packs up to 12.5 TOPS of onboard AI compute into that strip while drawing single-digit watts. For teams building drones and mobile robots, moving vision and decision-making off remote servers and onto the chassis solves a real problem when Wi-Fi drops or latency bites.

It does not solve the harder half of edge AI. Intelligence mounted on a moving body still has to live inside that body's thermal budget, battery curve, and software stack. A ceiling measured in trillions of operations per second tells you what silicon can burst on a cool bench; it says nothing about what happens twenty minutes into a warm flight with a fading pack.

### What Lantronix put on the table

On October 13, 2026, [Lantronix announced Spotter via GlobeNewswire](https://www.globenewswire.com/news-release/2026/10/13/3379546/0/en/lantronix-introduces-spotter-to-close-the-compute-gap-holding-back-drone-and-robot-autonomy.html), previewing the board at AUSA in Washington, D.C., with general availability targeted for the fourth quarter. Built around Qualcomm's Dragonwing QCS6490 processor, the platform combines onboard vision, sensor interfaces, and vehicle control while supporting open flight stacks like PX4 and ArduPilot so builders keep ownership of their autonomy code.

The [Spotter product page](https://www.lantronix.com/products/spotter/) lists configurations up to 8GB of memory and 64GB of storage alongside camera and sensor headers. It also carries the most honest sentence in the whole launch: specifications may change, and software may not yet support every listed feature. That caveat matters more than the headline benchmark, because integrating perception, drivers, and flight control is where robotics schedules actually slip.

Earlier this year, Qualcomm's Ahmed Sadek laid out the wider logic in a [February 24 robotics note](https://www.qualcomm.com/news/onq/2026/02/physical-ai-6g-robotics): keep fast sensing and reflexes local on the machine, and reserve remote servers for heavier planning when links are available. All of these details come from vendor releases and documentation rather than independent field tests, so Spotter's real value starts only when builders bolt it into working airframes.

![Conceptual illustration of onboard computing](https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/blog/edge-ai-onboard-compute-conceptual-illustration-of-onboard-computing.png)

*Illustration: Packing compute, camera links, and sensor buses into one sealed housing forces thermal and wiring tradeoffs immediately.*

### What changes once the chassis warms up

The pitch for onboard compute is appealing because it promises self-reliance. Cut the tether to a cloud API, and a rover in a basement or a drone past radio range keeps running. That part is genuine progress, and giving teams PX4 and ArduPilot compatibility out of the box lowers the barrier to testing real autonomy without building a custom carrier board from scratch.

Yet moving compute onto the vehicle moves every bottleneck onto the vehicle with it. Three practical tests separate a clean trade-show board from field gear:

First, sustained throughput under heat. A small enclosure with cameras, radios, and a processor running continuous object detection builds warmth quickly; if the chip throttles ten minutes into a route, peak TOPS never shows up when you need it. Second, graceful behavior when power sags or lighting shifts. Third, clean failure when operator contact disappears: does the machine hold a known safe state, or keep guessing with stale sensor readings?

It is fair to point out that a board vendor supplies the foundation, not the whole robot. Lantronix cannot predict every airframe or warehouse aisle its buyers will build. Even so, buyers evaluating edge AI hardware rarely regret demanding sustained-load numbers and driver maturity before committing a fleet.

The same discipline applies when you adopt a new local tool at your own desk. Peak capability on a clean sample file is easy to demo. What determines whether a tool earns a permanent place in your routine is how cleanly it handles the messy case at the end of a tired afternoon, and whether you can tell immediately why it stopped.

![Conceptual illustration of supervised mobile robot testing](https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/blog/edge-ai-onboard-compute-workshop-v2.png)

*Illustration: Short, supervised runs in a bounded aisle reveal thermal and sensor limits long before full deployment.*

### Test at the end of the shift

Before trusting any onboard module or automated workflow with a longer job, test it under its worst ordinary conditions: warm hardware, low margin, and one ugly edge case. Define what finishing looks like and what the tool should do when it cannot finish. Specs start the conversation; endurance settles it.

---

### Field Telemetry & Source Citations

* [Lantronix announcement, October 13, 2026](https://www.globenewswire.com/news-release/2026/10/13/3379546/0/en/lantronix-introduces-spotter-to-close-the-compute-gap-holding-back-drone-and-robot-autonomy.html): GlobeNewswire release detailing Spotter's Qualcomm Dragonwing QCS6490 specs, flight-software support, AUSA preview, and Q4 availability plan.
* [Lantronix Spotter product page](https://www.lantronix.com/products/spotter/): Technical documentation covering memory, storage, camera interfaces, and software-support caveats; checked October 15, 2026.
* [Qualcomm OnQ, Ahmed Sadek, February 24, 2026](https://www.qualcomm.com/news/onq/2026/02/physical-ai-6g-robotics): Vendor architecture overview splitting local low-latency sensing from remote planning in robotics.
