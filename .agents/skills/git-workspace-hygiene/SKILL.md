---
name: git-workspace-hygiene
description: >-
  Audit, clean up, and prune Git worktrees, Antigravity subagent workspaces, merged/stale local branches,
  obsolete remote tracking branches, and run Git garbage collection.
  Use whenever the user asks to clean up worktrees, prune branches, check repository workspace state,
  or perform routine Git maintenance.
---

# Git Workspace & Worktree Hygiene

This skill defines the safe inspection, pruning, and garbage collection protocol for multi-worktree Antigravity agent environments, local branches, and GitHub remote tracking branches.

---

## 1. Golden Rules of Git Cleanup

1. **Audit Before Deleting**: Always inspect active worktrees, branches (`-vv`), and merged status first. Present the summary to the user before running destructive commands unless explicitly instructed.
2. **Never Force-Delete Unmerged Branches Automatically**: Verify if a branch is merged into `origin/main` (`git branch --merged origin/main`). If unmerged, alert the user and ask for explicit confirmation before `-D` or remote deletion.
3. **Check Worktree Working Trees**: Before removing any worktree, verify `git -C <path> status -s` to guarantee no uncommitted modifications or untracked work are discarded.
4. **Clean Agent Worktree Directory**: Antigravity subagents store worktrees under `~/.gemini/antigravity/worktrees/<repo-name>/`. Ensure detached worktree folders are cleanly unlinked and pruned.
5. **Keep GitHub Clean**: Ensure repo setting `--delete-branch-on-merge` is enabled via `gh repo edit --delete-branch-on-merge`.

---

## 2. Standard Cleanup Pipeline

### Step 1: Discover & Audit
Run the diagnostic commands:
```bash
# 1. Check all active worktrees
git worktree list

# 2. Inspect Antigravity agent worktree folder
ls -la ~/.gemini/antigravity/worktrees/moltology/

# 3. Check current status of main working directory
git status -s

# 4. Inspect local branches and tracking status
git branch -vv

# 5. Check for merged local and remote branches
git branch --merged origin/main
git branch -r --merged origin/main
```

### Step 2: Inspect Worktrees for Unsaved Work
For any worktrees that are candidates for removal (e.g. subagent worktrees under `~/.gemini/antigravity/worktrees/`):
```bash
git -C <worktree-path> status -s
git -C <worktree-path> log -n 1 --oneline
```
- If clean and merged: Safe to remove.
- If uncommitted changes exist: Alert user and do not remove without confirmation.

### Step 3: Fast-Forward Default Branch (`main`)
Ensure the primary working tree is updated:
```bash
git pull --ff-only
```

### Step 4: Detach & Remove Stale Worktrees
```bash
git worktree remove <worktree-path>
# Clean up any residual metadata
git worktree prune
```

### Step 5: Delete Local Merged Branches
```bash
# Safe delete only (fails if unmerged)
git branch -d <branch_1> <branch_2> ...
```

### Step 6: Prune Remote Tracking Branches & GitHub Origin
```bash
# Delete obsolete or merged remote branches on GitHub (when instructed)
git push origin --delete <branch_name>

# Prune local references to deleted remote branches
git fetch --prune
```

### Step 7: Git Garbage Collection & Optimization
Free dangling objects, pack loose commits, and optimize the local Git database:
```bash
git gc --prune=now
```

---

## 3. GitHub Repository Configuration Checklist

To prevent remote branches from accumulating in the future:
```bash
# Automatically delete PR branches upon merge in GitHub
gh repo edit --delete-branch-on-merge
```
