#!/bin/bash

echo "🏌️ Golf Score Tracker - GitHub Setup"
echo "===================================="
echo ""
echo "Follow these steps to push to GitHub with different credentials:"
echo ""
echo "1. First, create a new public repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Repository name: golf-score-tracker"
echo "   - Make it public ✅"
echo "   - Don't initialize with README, .gitignore, or license"
echo ""
echo "2. Set local git config for this repository:"
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter your GitHub email: " GITHUB_EMAIL

git config user.name "$GITHUB_USERNAME"
git config user.email "$GITHUB_EMAIL"

echo ""
echo "3. Add GitHub remote and push:"
REPO_URL="https://github.com/$GITHUB_USERNAME/golf-score-tracker.git"

echo "Adding remote: $REPO_URL"
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

echo ""
echo "4. Push to GitHub:"
echo "When prompted, use your GitHub personal access token as password"
echo "(Create one at: https://github.com/settings/tokens)"
echo ""

git push -u origin main

echo ""
echo "🎉 Repository should now be live at:"
echo "https://github.com/$GITHUB_USERNAME/golf-score-tracker"
