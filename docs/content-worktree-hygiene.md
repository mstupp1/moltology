# Content pipeline completion

Read this before running a content pipeline, including supporting artwork, reference ingestion, research, and draft-only runs. Apply it across chained skills and on partial failures.

## Record the starting state

Run `git -c core.fsmonitor=false status --porcelain=v1 --untracked-files=all` and inspect staged and unstaged diffs before making changes. Record which files and hunks belong to existing work. Track the changes this run makes, including changes made by CLI tools and chained skills. Do not require a clean starting tree or disturb another task to begin production.

## Keep outputs in the right place

Keep generated media, previews, draft JSON, prompts, logs, and temporary runners in ignored `tmp/` or the skill's existing ignored `scratch/` directory. Preserve final media and retry metadata after failures. Archive finished social media in Google Drive through the social CLI; website and reusable character assets follow the S3 workflow. Preserve a skill's explicit tracked-asset exceptions, such as marketing screenshots.

Keep intentional durable work tracked: continuity ledgers, strategy experiment logs, published Markdown archives, reusable layout specs, registries, source changes, and skill updates. Add a narrow ignore rule only for genuinely disposable outputs; never ignore a ledger, published archive, or source change to hide dirty status.

## Commit the complete run

After the applicable verification, review and commit all intentional run-owned changes before returning. Include confirmed queue/publish metadata even if a later step failed; record only outcomes actually verified. A successful upload or queue operation does not prove that Git cleanup succeeded. Draft-only and render-only runs still finish this step when they intentionally changed tracked files; ignored outputs alone need no commit.

Use the CLI's supported `--commit` option when its complete staging scope belongs to this run. Blog and reel auto-commit helpers currently commit the staged index, so omit `--commit` and commit manually if unrelated files are staged or a selected file contains unrelated edits. Do not invent a commit flag for post, carousel, or series CLIs. Inspect their ledger changes and commit them explicitly.

For files wholly owned by the run, use explicit paths and exclude unrelated staged files:

```bash
git add -- <run-owned-path> <another-run-owned-path>
git commit --only -m "chore(content): record <run>" -- <run-owned-path> <another-run-owned-path>
```

If a selected file also contains unrelated edits, isolate this run's hunks with a temporary Git index or a separate worktree and preserve the existing staging. Do not commit the entire mixed file. Never use blanket `git add .` or `git add -A`, discard someone else's work, or manufacture cleanliness with `reset --hard`, `clean -fd`, or a hidden stash.

## Verify and report

Run `git -c core.fsmonitor=false status --porcelain=v1 --untracked-files=all` again and compare it with the starting state. A run that starts clean must finish clean. A run that starts dirty must leave no new uncommitted or untracked work of its own; preserve and report pre-existing or concurrent changes.

Report the commit ID and final Git state alongside the content result. If publication, checks, or committing fails, preserve recoverable files and report the exact unfinished paths and blocker. Do not claim the workflow is complete or the tree clean while run-owned changes remain.

Routine completion requires local commits. Push or reconcile with the remote when the user requests synchronization or an existing instruction authorizes it; inspect divergence first and preserve local and remote commits. Never force-push shared `main` to make it match. Do not repeat publication merely to synchronize Git.
