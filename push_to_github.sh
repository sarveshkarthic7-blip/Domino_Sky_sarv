#!/bin/bash
# DOMINO SKY - GitHub Push Script
# Configures PATH and pushes the committed codebase to https://github.com/sarveshkarthic7-blip/Domino_Sky_sarv.git

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

export PATH="/Library/Developer/CommandLineTools/usr/bin:/Library/Developer/CommandLineTools/usr/libexec/git-core:$DIR/.tools/node/bin:$PATH"
export GIT_EXEC_PATH="/Library/Developer/CommandLineTools/usr/libexec/git-core"

echo "Current Branch: $(git branch --show-current)"
echo "Remote URL: $(git remote get-url origin)"
echo "Pushing committed codebase to GitHub..."

git push -u origin main
