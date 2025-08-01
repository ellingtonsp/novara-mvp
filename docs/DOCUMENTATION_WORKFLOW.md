# Documentation Workflow Guide

This guide explains the optimized documentation workflow for the Novara MVP project.

## Overview

Documentation changes can now be fast-tracked to production without going through the full code review process. This ensures that documentation stays current and accurate.

## Key Features

### 1. Automated Detection
- GitHub Actions automatically detect documentation-only PRs
- PRs containing only `.md` files or changes in `docs/` are labeled as `documentation`

### 2. Pre-commit Protection
- A pre-commit hook prevents mixing documentation and code changes
- This ensures documentation changes can be fast-tracked

### 3. Simplified Review Process
- Documentation PRs require only one reviewer (defined in CODEOWNERS)
- Can be auto-merged after approval

### 4. Fast-Track Deployment
- Documentation approved in `develop` can skip staging if needed
- Automated PR creation from `develop` → `staging` → `main`

## How to Use

### Making Documentation Changes

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b docs/update-something
   ```

2. Make your documentation changes

3. Commit with the `docs:` prefix:
   ```bash
   git add docs/ *.md
   git commit -m "docs: update deployment guide"
   ```

4. Push and create PR:
   ```bash
   git push origin docs/update-something
   gh pr create --base develop
   ```

### What Happens Next

1. **Automatic Labeling**: PR is labeled as `documentation`
2. **Fast Review**: Only one reviewer needed
3. **Auto-promotion**: After merge to develop, automation creates PR to staging
4. **Quick Deploy**: Can be fast-tracked to main after verification

## Best Practices

- **Always separate commits**: Never mix docs and code
- **Use clear commit messages**: Start with `docs:`
- **Keep PRs focused**: One topic per PR
- **Update promptly**: Don't let docs get stale

## Troubleshooting

### Pre-commit Hook Issues
If the pre-commit hook is blocking a legitimate commit:
```bash
git commit --no-verify  # Use sparingly!
```

### Mixed Changes Needed
If you must include both docs and code:
1. Create two separate commits
2. Or create two separate PRs

## Benefits

- 📚 Documentation stays current
- 🚀 Fast deployment (minutes vs hours)
- 🔄 No waiting for code deployments
- ✅ Maintains git history integrity

---

Created: July 31, 2025
Version: 1.0