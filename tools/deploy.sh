#!/usr/bin/env bash
# Publishes this folder to GitHub Pages.
#
#   1. gh auth login          (once — opens a browser)
#   2. tools/deploy.sh        (creates the repo, pushes, turns Pages on)
#
# Safe to run again later; after the first time it just pushes.

set -euo pipefail

REPO_NAME="${1:-wedding}"
BRANCH="main"
export PATH="/opt/homebrew/bin:$PATH"

cd "$(dirname "$0")/.."

if ! command -v gh >/dev/null; then
  echo "The gh command is missing. Install it with:  brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "You are not logged in to GitHub yet. Run this first, then run me again:"
  echo
  echo "    gh auth login"
  echo
  exit 1
fi

USER_NAME=$(gh api user --jq .login)

if [ -n "$(git status --porcelain)" ]; then
  echo "→ committing your uncommitted changes"
  git add -A
  git commit -q -m "Update wedding site"
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "→ pushing to the existing remote"
  git push -u origin "$BRANCH"
else
  echo "→ creating github.com/$USER_NAME/$REPO_NAME"
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
fi

echo "→ enabling GitHub Pages"
gh api -X POST "repos/$USER_NAME/$REPO_NAME/pages" \
  -f "source[branch]=$BRANCH" -f "source[path]=/" >/dev/null 2>&1 \
  || gh api -X PUT "repos/$USER_NAME/$REPO_NAME/pages" \
       -f "source[branch]=$BRANCH" -f "source[path]=/" >/dev/null 2>&1 \
  || echo "  (Pages may already be on — check Settings → Pages)"

URL="https://$USER_NAME.github.io/$REPO_NAME/"

cat <<EOF

Done. Your wedding site will be live in two or three minutes at:

    $URL

  Invitation    $URL
  Guest portal  ${URL}guest.html
  Planner       ${URL}planner.html

Next: connect the guest database so guests see their real room numbers.
See SETUP.md, part 2.
EOF
