#!/usr/bin/env bash
set -e

echo "========================================================="
echo "  🚀 STARTING AUTOMATED MULTI-BRANCH MERGE PIPELINE"
echo "========================================================="

# 1. Checkout main
echo "--> [1/7] Checking out main branch..."
git checkout main

# 2. Merge all 4 feature branches
echo "--> [2/7] Merging feature/ui-layout-cleanup..."
git merge feature/ui-layout-cleanup -m "Merge: UI & Layout Overhaul"

echo "--> [3/7] Merging feature/audio-dual-engine..."
git merge feature/audio-dual-engine -m "Merge: Dual-Audio & Chime Scale"

echo "--> [4/7] Merging feature/gameplay-juice..."
git merge feature/gameplay-juice -m "Merge: Game-Juice & Safe-Area Controls"

echo "--> [5/7] Merging feature/progression-storage..."
git merge feature/progression-storage -m "Merge: Progression & Storage Sync"

# 3. Run automated tests
echo "--> [6/7] Running Playwright validation suite..."
node ./node_modules/@playwright/test/cli.js test

# 4. Prune worktrees
echo "--> [7/7] Pruning git worktrees..."
git worktree prune

echo "========================================================="
echo "  ✅ ALL FEATURES MERGED AND VALIDATED SUCCESSFULLY!"
echo "========================================================="
