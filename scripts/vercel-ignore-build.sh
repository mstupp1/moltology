#!/usr/bin/env bash
set -e

# Vercel Ignored Build Step Script
# Exit 1 = Proceed with build
# Exit 0 = Skip build (avoids generating build artifacts and deployment storage)

# 1. Always build production deployments on main
if [ "$VERCEL_ENV" = "production" ] || [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  echo "✅ Building production deployment ($VERCEL_GIT_COMMIT_REF)"
  exit 1
fi

# 2. Skip if commit message explicitly requests skipping
if echo "$VERCEL_GIT_COMMIT_MESSAGE" | grep -iqE '\[(skip vercel|skip ci|no deploy)\]'; then
  echo "🛑 Skipping preview build due to commit message directive"
  exit 0
fi

# 3. Allow manual override: build if commit message contains [preview] or [deploy]
if echo "$VERCEL_GIT_COMMIT_MESSAGE" | grep -iqE '\[(preview|deploy)\]'; then
  echo "✅ Building preview deployment due to commit override"
  exit 1
fi

# 4. Agent and doc scratch branches (claude/*, codex/*, cursor/*, docs/*, chore/*)
# Only build when an actual Pull Request is open ($VERCEL_GIT_PULL_REQUEST_ID is set).
if echo "$VERCEL_GIT_COMMIT_REF" | grep -iqE '^(claude/|codex/|cursor/|chore/|docs/)'; then
  if [ -z "$VERCEL_GIT_PULL_REQUEST_ID" ]; then
    echo "🛑 Skipping preview build for scratch/agent branch ($VERCEL_GIT_COMMIT_REF) without an open PR"
    exit 0
  fi
fi

# 5. Default: proceed with build for PRs and standard feature branches
echo "✅ Proceeding with build for $VERCEL_GIT_COMMIT_REF (PR: ${VERCEL_GIT_PULL_REQUEST_ID:-none})"
exit 1
