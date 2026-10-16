---
name: git-workspace-hygiene
description: >-
  Audit and retire obsolete Git worktrees and merged branches across Codex, Claude,
  and Antigravity. Supports conservative scheduled cleanup and interactive investigation
  of squash merges and superseded work, preserving active and uncertain workspaces.
---

# Git Workspace Hygiene

Keep the primary folder on `main`. A merged PR does not mean its workspace is retired.
Start follow-up work on a fresh branch from updated `origin/main`; the same clean worktree
folder can be reused. Weekly cleanup is a backstop for retired workspaces.

## Modes and authorization

- **Audit:** Read-only inventory and recommendations.
- **Interactive cleanup:** A cleanup request authorizes verified, inactive, clean, merged
  leftovers. Present the concrete audit summary before removal without redundant approval.
  Investigated exceptions require explicit authorization identifying the branches/worktrees
  before force deletion. Existing authorization for those exact retirements remains valid.
- **Scheduled cleanup:** Requires an authorized schedule and every eligibility gate below.
  Skip and report exceptions. Silence is never approval. Editing or invoking this skill does
  not authorize installing a schedule, changing repository settings, or deleting remote branches.

## Audit

1. Resolve repository root and common Git directory. Preserve the primary checkout, the
   checkout executing cleanup, `main`, the remote default branch, and explicitly protected
   branches/workspaces. Acquire an exclusive repository-scoped cleanup lock; stop if occupied
   and release it on exit. A cleanup lock does not block other Git writers.
2. Inventory `git worktree list --porcelain`, `git branch -vv`, and remote refs. Include all
   tools' registered paths. Never recursively delete agent directories or assume unregistered
   folders are disposable.
3. Run `git fetch --prune origin`. If refresh fails, scheduled runs make no deletions.
   Compare against freshly fetched `origin/main`; do not pull, reset, or switch checkouts
   merely to clean up.
4. Inspect each candidate's HEAD, branch, lock state, status, ignored files, and activity.
   Use `git -C <path> status --porcelain=v1 --untracked-files=all`. Status errors, missing paths,
   initialized submodules, and uncertain ownership are exceptions. A broken fsmonitor can be
   bypassed with `git -c core.fsmonitor=false ...`.

## Scheduled eligibility: all gates required

- Exact HEAD is an ancestor of fresh `origin/main`, verified with
  `git merge-base --is-ancestor <head> origin/main`. Deleted upstreams, closed PRs, branch names,
  or age do not prove integration.
- The associated PR is confirmed merged at least **seven full days** ago. Query all PRs for
  the exact source branch and repository. Skip open PRs, ambiguous associations, unavailable
  metadata, or branches reused after merging. Detached worktrees without provable PR association
  require interactive review.
- No staged, unstaged, or untracked files. Inspect ignored content too: preserve unique artwork,
  exports, local databases, configuration, and other local assets. Only known reproducible
  caches/dependencies may be discarded; uncertainty means skip.
- No branch/HEAD reflog activity within seven days. Commit author dates or directory timestamps
  alone are insufficient. Missing activity evidence means skip.
- Affirmative retirement evidence exists: explicit user retirement authorization for the path,
  or a reliable owning-tool lifecycle signal that the task completed and released its workspace.
  Idle, clean, merged, or old alone is insufficient. Check owning-tool state and running agents,
  servers, and terminals using the path where supported. Any activity or uncertainty overrides
  retirement evidence; if owning-tool state cannot be established, skip the worktree.
- No lock or keep protection. Honor `git worktree lock`; never unlock automatically. Unlocked
  does not mean inactive.

Branches without worktrees require the same integration, PR, grace, protection, and inactivity
checks. Interactive cleanup may waive grace or missing metadata only after explicit retirement
of identified candidates following the audit. Never discard dirty or unique files incidentally.

## Squash merges and superseded work

An ancestry failure means preserve and investigate, not necessarily unfinished work. Check PR
state, squash/merge commits, `git cherry`, stable patch IDs, and current files/history. A matching
patch establishes equivalent work; a merged PR does not establish that later commits landed.
Compare every branch-only commit and merge resolution. For superseded code, identify its
replacement and verify no unique work remains. Do not cherry-pick old code to permit deletion.

Scheduled runs report these cases without force deletion. Interactive runs explain the evidence
and obtain explicit authorization for the identified retirement before `-D` or remote deletion,
unless already authorized. Preserve unresolved branches and worktrees.

## Execute and verify

- Record paths, branches, exact SHAs, evidence, and skip reasons before mutation. Immediately
  recheck refs/HEAD, cleanliness, locks, and activity before each removal. Skip changed candidates;
  do not race active writers.
- Use the owning app's archive lifecycle for managed worktrees when available and authorized.
  For Codex, inspect attached artifacts and archive eligible managed attachments with the app
  tool. Never bypass ownership restrictions using shell removal. If safe retirement is unavailable,
  preserve and report the workspace.
- For ordinary worktrees use `git worktree remove <path>` without force. On refusal, stop that
  candidate; never fall back to forced removal, `rm -rf`, or deleting caches to bypass refusal.
- Delete local branches only after ensuring no worktree uses them and their tips remain eligible.
  Prefer `git branch -d`; on refusal report the exception instead of retrying with `-D` automatically.
  Scheduled runs never use `-D`.
- Remote deletion requires explicit authorization naming the branch. Recheck its remote SHA and
  use an exact-SHA lease to avoid deleting newer work. Fetch pruning only removes stale local
  tracking refs; it does not authorize GitHub branch deletion.
- Inspect `git worktree prune --dry-run`; prune only verified retired metadata. Missing directories
  may be temporarily unavailable. Do not prune unresolved entries.
- Never use `git gc --prune=now`, expire reflogs, or run aggressive collection. Routine Git maintenance
  is sufficient. If collection is requested, retain normal defaults and avoid concurrent Git writers.
- Verify final worktrees, branch refs, and primary status. Report actual removals and preserved
  exceptions. On failure preserve remaining candidates and report the partial outcome.

## Recurring operation

Weekly scheduled runs use these gates, not an ad hoc deletion pipeline. Stay quiet when nothing
meaningful changes; report removals, failures, or exceptions requiring a decision. Do not weaken
checks to produce cleanup. Automatic operation may conservatively leave work for interactive review.

GitHub delete-branch-on-merge reduces remote clutter but does not retire local worktrees. Inspect
or change that setting only when requested; local cleanup must not depend on it.
