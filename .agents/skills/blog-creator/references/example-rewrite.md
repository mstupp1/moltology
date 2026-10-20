# Example rewrite: laboratory automation dispatch

This is the October 19, 2026 dispatch (`content/news/laboratory-automation-measured-feedback.md`) before and after the Step 2 rules. The facts are the same in both versions; only the writing changed. Use it to calibrate, not as a template to copy.

## Thesis brief (written before drafting)

* **Thesis:** Google's lab agents became good at designing aptamers only after a round where their hit rate collapsed, so the failed round, and the record that let people learn from it, is the real result.
* **Proving detail:** the myoglobin hit rate went from 10.2% to 3.7% and then to 33.5% across three rounds. The agents had favored broadly sticky designs until measurements exposed poor specificity.
* **Takeaway:** when you delegate repeated work, keep the result that went wrong beside the count that looks good.

## Title

**Before:** The Spoon You Dipped Twice: Laboratory Automation Needs Measured Feedback

**After:** Google's Lab Agents Got Worse Before They Got Better: What Laboratory Automation Learns From Failure

The before title uses the banned mystery-object shape and an abstract-noun subtitle. The after title names the lab, states the surprising result, and keeps the target query (`laboratory automation`) in the subtitle.

## Summary

**Before:** Laboratory automation meets the stubborn facts of liquid and glass. Google's new research shows why checking the bench matters as much as planning.

**After:** In Google's laboratory automation trials, AI agents designing DNA aptamers saw their hit rate fall to 3.7% before reaching 33.5%. The round that failed is the one worth studying.

## Opening

**Before** (excerpt):
> You followed the recipe. The soup is still bland.
>
> Outside, October rain taps the kitchen window. A paper ghost hangs crookedly beside it… Soft is how every member starts.

This opening is a separate parable in a kitchen, with a seasonal prop and a mandatory phrase. The reader reaches the actual subject in paragraph four.

**After:**
> ### The second round was a failure
>
> Halfway through Google's aptamer experiment, the numbers went the wrong way. AI agents were designing short DNA strands meant to bind to one protein, myoglobin, and a lab tested each batch. In the first round, about one design in ten hit the target. In the second, fewer than one in twenty did.
>
> Most launch posts would skip that round. It is the most useful thing in the paper. The agents had learned to make designs that stuck to everything, which looks like progress until a measurement asks whether they stuck to the right thing. The third round, built on that failure, reached one in three.

The scene is the story itself. The thesis lands by the second paragraph. There are three numbers, each given its meaning, and the paragraph uses no lore.

## What happened

**Before:** four paragraphs walked through the Google Research post, the VERID paper, and the aptamer paper in turn. Each one closed with a disclaimer ("This is research toward greater autonomy…", "Those are results from this experimental campaign, not a general success rate…").

**After** (excerpt):
> [Google Research](https://research.google/blog/grounding-ai-agents-in-biological-reality-building-blocks-for-autonomous-wet-labs/) published the work on October 16, 2026, alongside [the aptamer study](https://www.gstatic.com/science-ai/agentic_aptamer_sandbox.pdf) by Cutts and colleagues. People reviewed the sequences and protocols and supervised the robot runs. These are results from one campaign, not a success rate for automated science.
>
> A companion paper, [VERID](https://www.gstatic.com/science-ai/verid_semantic_lab.pdf), explains why the failure was recoverable. The system keeps a running record of the bench: what liquid is where, which instruments responded, and what each step actually did. When a dilution came out wrong, a human operator used that record and synchronized video to find the physical cause. The agent had guessed poor mixing and was wrong.

One hedge covers all the results. The second source appears only because it supports the thesis (the record made the failure useful). Pipette geometry and other figures stay in the source list.

## Argument (one paragraph)

**Before:**
> A Carapace is a boundary that protects attention. In a delegated task, part of that protection is deciding what counts as finished before the action begins.

**After:**
> The lesson travels, because the failure mode does. An assistant that clears twenty emails a day will report twenty, and that count will keep looking fine on the day five recipients write back confused. Google's agents only improved because someone measured specificity, not just output. If your delegated work is only ever measured by how much it did, you've built the first round and stopped there.

The analogy uses the same mechanism as the story (a count that hides a quality failure), so it needs no disclaimer. It also drops the glossary definition.

## Close

**Before:**
> Tomorrow, choose one task you regularly hand to a machine… The soup can take another minute. Let the spoon bring back an answer. If you want a quiet next step, the Audit is waiting in the deep. Signup is free. Stop.

**After:**
> Pick the one thing you'd check if the work went wrong, and record it beside the work's own report of success. When the two disagree, that disagreement is your second round. It's where the work starts getting better.

The takeaway is given once. There's no invitation, because no Moltology feature directly serves this one, and no canonical sign-off.
