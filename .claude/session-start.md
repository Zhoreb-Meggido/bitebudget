# Session Start Checklist for Claude

**⚠️ READ THIS AT THE START OF EVERY SESSION BEFORE ANY GIT OPERATIONS**

## 🔄 Standard Workflow

### Assumption: PRs are merged and branches are deleted
**ALWAYS assume that previous PRs have been merged and their branches (local + remote) have been deleted.**

The user may not explicitly mention this, but it's the standard workflow:
1. User creates PR from Claude's branch
2. User merges PR to main
3. User deletes remote branch
4. User deletes local branch

### Before starting ANY git work:

1. **Always start fresh from main:**
   ```bash
   git fetch origin main
   git checkout main
   git pull origin main
   ```

2. **Never ask "Has this PR been merged?"**
   - Assume it has been if work was pushed previously
   - Just start from main

3. **Create new branch for new work:**
   ```bash
   git checkout -b claude/task-name-[SESSION_ID]
   ```
   - Use current session ID from task description
   - Branch format: `claude/feature-name-011CUzUKL2YsAPuqiD9kHdZF`

4. **Before cherry-picking or continuing work:**
   - Check if commits are already in main
   - If yes: Work is done, no need to duplicate
   - If no: Create new branch and cherry-pick

## ❌ What NOT to Do

- ❌ Never continue working on a branch from a previous session
- ❌ Never assume old branches still exist
- ❌ Never push to a branch that might have been merged
- ❌ Never ask if PR was merged - assume it was

## ✅ What TO Do

- ✅ Always start from main
- ✅ Always create new branch with current session ID
- ✅ Check git log to see what's already in main
- ✅ Read .claude/workflow.md if unsure about process

## 🔍 Quick Check Commands

```bash
# See recent commits in main
git log origin/main --oneline -10

# Check if work exists in main
git log origin/main --grep="keyword" -i

# Verify branch doesn't exist remotely
git ls-remote --heads origin claude/branch-name
```

## 📝 Current Session

Check task description for current session ID format.
Example: `011CUzUKL2YsAPuqiD9kHdZF`
