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
   # First, check if branch exists locally and delete it
   git branch -D claude/[task-description]-[SESSION_ID] 2>/dev/null || true

   # Check if branch exists remotely and delete it
   git push origin --delete claude/[task-description]-[SESSION_ID] 2>/dev/null || true

   # Now create fresh branch
   git checkout -b claude/[task-description]-[SESSION_ID]
   ```
   - Session ID must match the current Claude Code session
   - Branch name format: `claude/feature-name-011CUzUKL2YsAPuqiD9kHdZF`
   - The `2>/dev/null || true` ensures no errors if branch doesn't exist
   - This prevents GitHub PR creation issues from old branch names

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

## 🔧 Troubleshooting

### "Cannot create PR - branch name already used"

If GitHub refuses to create a PR because the branch name was used before:

```bash
# Option 1: Force delete old branch (recommended)
git push origin --delete claude/old-branch-name
git branch -D claude/old-branch-name
git checkout -b claude/old-branch-name
# Make your changes and push again

# Option 2: Use a more specific branch name
git checkout -b claude/feature-name-v2-[SESSION_ID]
```

### Verify branch doesn't exist remotely:
```bash
git ls-remote --heads origin claude/[branch-name]
# Empty output = branch doesn't exist (good!)
# If it shows a branch, delete it first
```

### Clean up all merged branches:
```bash
# Prune deleted remote branches
git fetch --prune

# List all local branches
git branch -a

# Delete specific local branch
git branch -D claude/old-branch
```

## 📝 Current Session ID

Check the task description or git branch for the current session ID format.
Example: `011CUzUKL2YsAPuqiD9kHdZF`
