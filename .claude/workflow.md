# Git Workflow & Branch Management

## ⚠️ IMPORTANT: Branch Lifecycle

**After every PR merge:**
1. User ALWAYS deletes the remote branch immediately after merging
2. User ALWAYS deletes the local branch
3. Claude should NEVER assume old branches still exist

## 🔄 Standard Workflow for New Tasks

**Before starting ANY new work:**

1. **Fetch and checkout main:**
   ```bash
   git fetch origin main
   git checkout main
   git pull origin main
   ```

2. **Create new branch from main:**
   ```bash
   git checkout -b claude/[task-description]-[SESSION_ID]
   ```
   - Session ID must match the current Claude Code session
   - Branch name format: `claude/feature-name-011CUzUKL2YsAPuqiD9kHdZF`

3. **Make changes and commit regularly**

4. **Push to remote:**
   ```bash
   git push -u origin claude/[branch-name]
   ```

5. **After PR is merged:**
   - User will delete both local and remote branches
   - Claude should NOT reference this branch again

## 🚫 What NOT to Do

- ❌ Never continue working on an old branch after its PR is merged
- ❌ Never assume a branch still exists on remote
- ❌ Never cherry-pick commits from merged PRs (they're already in main)
- ❌ Always create NEW branches from the latest main

## ✅ Best Practices

- Always check `git status` before starting work
- Always verify you're on the correct branch
- If unsure, ask user: "Has this PR been merged yet?"
- Start fresh from main for every new task

## 📝 Current Session ID

Check the task description or git branch for the current session ID format.
Example: `011CUzUKL2YsAPuqiD9kHdZF`
