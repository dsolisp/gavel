---
name: gavel-pr-prep
description: >
  Prepare a branch for pull request. Commit uncommitted changes, fetch
  and merge main, resolve conflicts, verify fast-forward (zero
  ahead/behind with main), and push. Framework-adaptive: works with any
  Git-based repo. Use when the user says "gavel-pr-prep", "/gavel-pr-prep",
  "prepare PR", "ready for merge", or "merge main into my branch".
---

# Gavel PR Prep

Prepare the current branch for a clean pull request onto main.
Follows the Test Constitution: zero merge conflicts, fast-forward only.

## Steps

### 1. Pre-Flight

```
git status          # Check for uncommitted changes
git branch --show-current
```

If uncommitted changes exist:
- Stage all: `git add -A`
- Commit with descriptive message (use conventional commits: feat/fix/refactor/chore)
- Show the diff stat for the commit message

### 2. Fetch Latest Main

```
git fetch origin main
```

### 3. Check Divergence

```
git log --oneline origin/main..HEAD   # Our commits ahead
git log --oneline HEAD..origin/main   # Main's commits we don't have
```

If 0 behind: branch is already a clean fast-forward. Skip to step 5.

### 4. Merge Main

```
git merge origin/main --no-edit
```

If conflicts:
1. List conflicted files: `git diff --name-only --diff-filter=U`
2. For each conflict, inspect markers and resolve:
   - If our changes should win: `git checkout --ours <file> && git add <file>`
   - If main's changes should win: `git checkout --theirs <file> && git add <file>`
   - If both matter: manually edit, remove markers, `git add <file>`
3. Commit the merge: `git commit --no-edit`

### 5. Verify Fast-Forward

```
# Must show: 0 ahead (we just merged) or N ahead (our commits)
# Must show: 0 behind (we have everything main has)
git log --oneline HEAD..origin/main | wc -l   # Should be 0
```

Also verify with merge-tree:
```
git merge-tree $(git merge-base HEAD origin/main) HEAD origin/main | grep -c "CONFLICT"
# Should output 0
```

### 6. Push

```
git push origin <branch-name>
```

## Output

```
gavel-pr-prep verdict:

  Branch:     <branch-name>
  Commits:    <N> ahead of main, 0 behind
  Conflicts:  <count> resolved
  Fast-forward: yes/no

  Ready for PR: <YES | NO — reason>
```

Ready: `Branch ready. Open PR on <remote-url>.`
Not ready: `Branch not ready. Fix: <list>.`

## Boundaries

Modifies git state (commits, merges, pushes). Does not modify source files
beyond conflict resolution. Does not create the PR (user does that in browser).
"gavel-pr-prep" or "/gavel-pr-prep" to invoke.
"stop gavel-pr-prep" or "normal mode" to revert.
