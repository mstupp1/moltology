# Codex brief for writing benefit pages

Paste this whole file into `codex exec`, then add a "Your kit" section: the kit, the existing page to copy as the shape, and one line per page (slug | topic | query | hook.href | notes). Run on Sol 6.2 at high effort: `codex exec -s workspace-write --skip-git-repo-check -c model_reasoning_effort="high" "$(cat brief.md)" </dev/null`. Several kits can run at once if summaries.ts already lists every page.

---

You are writing Moltology benefit landing pages (copy only) in this repository. Work only in this directory.

Read these first and follow them exactly:
- .agents/skills/benefit-landing-pages/SKILL.md: the sections "Adding a page to an existing kit", "Copy rules" (including "Product facts to check copy against") and the review lessons in "Building a new kit" step 7.
- .agents/skills/benefit-landing-pages/references/archetypes.md (your kit's row).
- src/lib/benefits/types.ts (your kit's Content type) and scripts/lib/benefit-pages-check.ts (the rules the checker enforces: banned phrases, CLAIM_BANS, FAQ_INTENT_BANNED, REVEAL_SHAPES, limits).
- The existing page in your kit (named below). Use it as the SHAPE only: same fields, same image fields. Rewrite every string. Do not keep any sentence or sentence shape from it or from any other file in src/lib/benefits/pages/.
- src/lib/alignment-tasks.ts for the 8 daily task titles, and src/lib/codexData.ts for real Codex text when you quote or paraphrase a verse.

For each page in your list, create src/lib/benefits/pages/<slug>.ts:
- slug, topic and kit exactly as given. indexed: false. updated: '2026-11-22'.
- query exactly as given. Put its words in title (max 60 chars, ends with "| Moltology") and description (110 to 160 chars), and at least half of the query's words (always the head noun) in content.hero.headline.
- hook.href exactly as given (it is unique across all pages). hook.label names the real thing; hook.text says plainly what it asks of you.
- Image paths: /images/benefits/<slug>/<name>.jpg?v=2, using exactly the same image fields, names and sizes the kit's existing page uses (shareImage plus whatever the content uses, e.g. hero, story). Write honest alt text describing a crab or lobster character in that industry's photo style. Never humans.
- 5 to 8 FAQs that are real questions people search about this angle; at least two use the query's words. No cost, free, price, sign-up, demo or "can I try it" questions. Do not start FAQs with "Is Moltology a" or "What is Moltology". Vary how questions open across your pages.
- reveal.headline: a fresh line, not "X was a costume/metaphor", not "... is real", not "... is an app". reveal.body: one short line specific to the page. Keep the reveal.screenshot field shape the kit page uses.
- related: 2 or 3 other slugs from src/lib/benefits/summaries.ts (prefer pages on nearby topics).
- disclaimer: required for health or money angles (given below); a plain one-sentence line.
- At least 450 words of page copy (content + FAQs + hook + reveal).

Copy rules that reviewers keep catching:
- Describe what the practice asks, never what it delivers. No "you will feel/see/get...", no "most members", no timelines, no "proven/guaranteed/clinically/safest". No medical, financial or nutritional claims.
- Never invent reviews, people, doctors, credentials, member counts, ratings, prices or results. "$0 / month" and "free" are true.
- Only real features: 8 daily tasks (exact titles from alignment-tasks.ts), the 15-question Moltmax quiz at /moltmax, the Oracle AI guide (free daily limit; optional Oracle MAX at /max), the Codex, the forum and its boards, the weekly XP leaderboard (resets Monday 00:00 UTC), the 3D character and its cosmetics shop, the 5 stats Shell, Torque, Synapse, Ecdysis, Depth. Gear changes looks and stats, never XP, stage or rank. Paid things exist (Oracle MAX, Molt Credits, merch store); never say anything is "the only paid" thing.
- Any list or stat that says eight shows all eight tasks; numbers must match what is beside them.
- Never explain the costume ("this page borrows the look of...", "dressed as a ..."). Play the industry tropes straight.
- Plain sentences, one idea each, at most two lore words per page. None of the BANNED_PHRASES. No catchphrases.
- No links or buttons that look clickable but go nowhere; every href is a real route (/codex/scr-NNN#verse-N with real verse numbers, /moltmax, /oracle, /max, /forum, /forum/<board-slug>, /forum/leaderboard, /character, /character/shop, /character/progress, /character/3d, /profile, /dashboard, /store, /codex).
- Grids: if a kit renders items in a grid, use counts that fill rows (match the existing page's counts unless the existing page shows otherwise).
- Every page must differ from its siblings: different hero headline shape, different FAQ openings, different section titles where the type allows free text.

Do NOT edit summaries.ts (rows are already there), kits, components, types, the checker, or any existing page. Only create your new page files.

When done, run: npm run benefits:check -- --no-images
Other kits' pages are being written at the same time, so ignore [missing-page] errors for slugs that are not yours and any errors on pages you did not write. Every rule on YOUR pages must pass (including duplicate-copy against existing pages). Then run: npx tsc --noEmit -p . 2>&1 | grep benefits  (it must print nothing for your files). Fix and re-run until clean. Finish with a short list of the files you created.

## VOICE: the first drafts failed on this, read carefully

A first pass at these pages passed the checker but read like a nervous compliance memo. It hedged every line, never played the industry, and used stiff, abstract verbs. The finished pages in the same kit are your voice benchmark: read src/lib/benefits/pages/libido.ts, energy-drinks.ts, investing.ts and strength.ts, and match their register: short, warm, confident, concrete, second person, a little dry humour from playing the costume straight.

Do this:
- Sound like the industry's own marketing copy. Clinic = calm telehealth brand ("Online assessment · free", "Get your free plan", "How it works"). Can = loud energy-drink can (short punchy lines, stickers, flavor names). Retreat = slow, soft wellness retreat. Atelier = fashion-house editorial. Ledger = fintech app. Locker = sportswear spec sheet and training talk. Platform = AI SaaS launch. Arcade = game launch and patch notes. Seminar = self-help book jacket and live seminar. Network = bright social app. The trust strip, checks, eyebrows, tags and CTAs should be the genre's stock phrases, made true for Moltology ("Free to join", "No pills or prescriptions", "Nothing to cancel", "Zero sugar").
- Headlines a copywriter would sign off on. Good: "Low libido? Start with the ordinary things." "The energy drink alternative with zero caffeine." Bad (from the failed drafts): "One document open. How to focus better?" "A small question: how to spice up your life?" "Inner beauty deserves a closer look." "Brain fog, an unopened inbox, and a pause."
- Plain verbs: do, pick, read, write, stop, ask, try, put the phone down. Avoid: examine, consider, deliberate, attend to, participation, interrogate, reflection prompts, "in ordinary language", "specific enough to describe/act on", "make a real attempt", "as evidence of", "rather than" (max twice a page), "without treating/turning X into Y".
- Say each limit once, in the disclaimer or one FAQ. Do not repeat "this makes no promise", "is not a clinical assessment", "a task record cannot diagnose" across the page. One clear sentence is enough. Never write a line whose only job is to disclaim.
- FAQ answers lead with the direct answer in the first sentence (a yes, no, a number or a definition), then one or two useful, specific sentences. They must read well alone in Google. Topic FAQs should give real, generally accepted, practical guidance on the topic (e.g. what the pomodoro technique is, common causes of brain fog to raise with a doctor, what habit stacking means), then connect to the practice in one sentence at most.
- Concrete pictures from real life beat abstractions: "the email you reread six times", "the 3pm can", "the group chat at midnight".
- Use the product names correctly and naturally: "the eight daily tasks", task titles in sentence case as written, "the Oracle, our AI guide", "the Moltmax quiz".
- Do not mention "crab or lobster character" in copy except where the kit shows the character (and then just "your character"). Never describe what the page or a picture is.
- Write object keys unquoted, exactly like the example page's formatting.

