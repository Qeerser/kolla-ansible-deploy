# Git Version Control for Kolla OpenStack Helper

## Current Version

-   **v1.0.0**: Refactored architecture with simplified Kolla-Ansible commands

## Git Commands Quick Reference

### Save Current Changes

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Your commit message describing the changes"

# Create a version tag (optional)
git tag -a v1.0.1 -m "Version 1.0.1: Description of changes"
```

### View History

```bash
# View commit history
git log --oneline

# View all tags
git tag

# View changes in working directory
git status

# View differences
git diff
```

### Restore Previous Versions

```bash
# View specific commit
git show <commit-hash>

# Restore specific file from previous commit
git checkout <commit-hash> -- <file-path>

# Reset to previous version (careful!)
git reset --hard <commit-hash>

# Restore to a tagged version
git checkout v1.0.0
```

### Branching (for experimentation)

```bash
# Create and switch to new branch
git checkout -b feature-branch

# Switch back to main branch
git checkout main

# Merge feature branch
git merge feature-branch

# Delete branch after merging
git branch -d feature-branch
```

## Current Repository State

-   ✅ Git repository initialized
-   ✅ All files committed
-   ✅ Tagged as v1.0.0
-   ✅ .gitignore configured for Node.js/React projects

## Next Steps

1. Make your changes to the code
2. Test the changes work correctly
3. Run `git add .` to stage changes
4. Run `git commit -m "Description of changes"` to save
5. Optionally create a new tag: `git tag -a v1.0.1 -m "New version"`

This ensures all your work is saved and you can always go back to previous versions!
