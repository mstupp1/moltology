---
title: "Two Grips, One Bag: How Robotic Arms Coordinate"
slug: "robotic-arms-coordination"
summary: "NVIDIA’s MAWAM experiment shows how robotic arms can improve at a shared task by planning their moves together."
category: "SWARM ARCHITECTURE"
tags:
  - "robotic arms"
  - "NVIDIA MAWAM"
  - "Robot coordination"
authorName: "Silas Trench"
authorRole: "Senior Benthic Telemetry Correspondent"
readTimeMinutes: 4
isFeatured: true
isPublished: true
publishedAt: "2026-11-23T09:02:59-05:00"
coverImageUrl: "https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/blog/robotic-arms-coordination-cover.png"
---

A laundry bag gives two robotic arms a single mouth to keep open. One grip can be exactly where its controller told it to go and still leave the opening too narrow for a garment. You can pass both arms on their individual moves and still have laundry on the table.

NVIDIA’s November MAWAM release makes a case for grading these robots on the bag. The researchers tested whether two robots could keep one bag open while a garment went in. The strongest evidence came from trying the same job with a version of their model that denied each robot access to the other robot’s information inside the planner. [NVIDIA’s MAWAM project](https://research-staging.nvidia.com/labs/lpr/mawam)

### The bag is the unit of work

In the laundry trials, the full model succeeded 16 times out of 30. With the connection between the robots removed, it succeeded 11 times. In both cases the researchers gave credit only when the garment ended inside the bag and both robots had let go of the garment. A tidy lift or a promising opening earned nothing on its own. Fan and colleagues used the same pair of Galaxea robots and the same physical task for the comparison. [MAWAM preprint, Table 1 and §4.1](https://arxiv.org/html/2611.25105v1#S4.SS1)

That change inside the model matters because the robots saw the bag from different positions. Each had a head camera view and views at its wrists. They had no overhead camera to settle what the bag was doing between them. During planning, the full model could use information across those views and across the robots’ proposed moves. Removing that connection left each side to work from its own information. The gap in completed loads is the part of the experiment I’d bring to a lab review. A replay of either wrist alone would give the reviewer half of the evidence. Put the views on the same timeline and you can see whether one lip dropped while the other gripper was still pulling upward.

![Close view of a robotic gripper pinching a stitched bag rim](https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/blog/robotic-arms-coordination-close-view-of-a-robotic-gripper-pinching-a-stitched-bag-rim.png)

*Illustration: Tension from one gripper travels through the stitched rim to the other grip.*

### Both robots move before either gets a fresh look

MAWAM predicts what each robot will see along with the moves each will make. The pair executes only the first part of that plan in lockstep. Then the model takes in the actual scene and draws up the next set of moves. Think of the bag rim twisting as one wrist rises. The predicted view gives the model a way to account for what that rise should do to the other side of the bag. The next observation gives it a chance to work with the twist that actually happened. [MAWAM preprint, §3.4](https://arxiv.org/html/2611.25105v1#S3.SS4)

The strongest objection is sitting right there in the trial setup. A rigid frame could hold the bag open and leave a single robot to load it. For a station that does laundry all day, I’d want to see that fixture priced and tested first. The case for learning this coordination gets stronger at a station where the job changes and the second grip has to move. The same paper’s umbrella handover illustrates the difference. The first robot eventually has to give up its grip, so its success depends on whether the receiver has taken the weight.

The laundry runs started with the robots in fixed poses, and the team varied object placement within set bounds. The improvement tells a technician where to look when a coordinated attempt fails. It leaves a practical question for any installation with a wider range of loads. A new bag may hang lower between the grippers, or a stiff seam may keep one lip upright while the opposite lip folds in. I’d want those conditions in the acceptance test before assigning the pair a station.

![Two industrial robot arms holding a laundry bag between their workstations](https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/blog/robotic-arms-coordination-two-industrial-robot-arms-holding-a-laundry-bag-between-their-workstations.png)

*Illustration: The space between the grippers has to leave a clear path for the garment.*

### Ask for a run where one grip falls behind

When a vendor shows two robotic arms handling one flexible object, ask for the full completion count and an uncut attempt with one grip deliberately delayed within the rig’s safe test limits. For the bag task, watch the opening through the next planning cycle and follow the garment until both robots let go. If the pair can recover, the video should show where the opening comes back and whether loading finishes. If the garment stays outside, the station still owes you a load.

---

### Field Telemetry & Source Citations

- The November 20 NVIDIA project release shows the physical laundry, towel and umbrella tasks and describes the jointly predicted camera views and actions. [NVIDIA MAWAM project](https://research-staging.nvidia.com/labs/lpr/mawam)
- The November 18 preprint by Xianzhe Fan and colleagues documents the real-robot comparison, terminal success criteria, camera setup and joint control loop. [MAWAM preprint](https://arxiv.org/html/2611.25105v1)
