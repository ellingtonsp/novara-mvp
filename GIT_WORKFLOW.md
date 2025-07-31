# Git Workflow and Branch Strategy

## Branch Structure

We use a three-branch strategy to ensure safe and tested deployments:

```
develop → staging → main (production)
```

### Branches

1. **`develop`** (Default branch)
   - Active development happens here
   - All feature branches merge into develop
   - May contain unstable or experimental code
   - No automatic deployments

2. **`staging`**
   - Pre-production testing environment
   - Merges from develop after features are complete
   - Automatically deploys to Vercel staging environment
   - Used for final testing before production

3. **`main`** (Production)
   - Production environment
   - Only receives tested code from staging
   - Automatically deploys to Vercel production
   - Should always be stable

## Workflow

### 1. Feature Development
```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/EPIC-ID-description

# Work on feature
# ... make changes ...

# Push feature branch
git push -u origin feature/EPIC-ID-description

# Create PR to develop (not main!)
```

### 2. Testing in Staging
```bash
# After PR is merged to develop
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# Automatic deployment to staging environment
# Run tests and verify
```

### 3. Production Deployment
```bash
# After staging is tested
git checkout main
git pull origin main
git merge staging
git push origin main

# Automatic deployment to production
```

### 4. Hotfixes
For urgent production fixes:

```bash
# Create from main
git checkout main
git checkout -b hotfix/description

# Fix issue
# ... make changes ...

# Push and create PR to main
git push -u origin hotfix/description

# After merge, backport to develop and staging
git checkout staging
git merge main
git push origin staging

git checkout develop
git merge main
git push origin develop
```

## Important Rules

1. **NEVER commit directly to main or staging**
2. **ALWAYS create feature branches from develop**
3. **ALWAYS test in staging before production**
4. **ALWAYS keep develop updated with main** (for hotfixes)

## Environment Mapping

- `develop` branch → Local development only
- `staging` branch → https://novara-mvp-staging.vercel.app
- `main` branch → https://novara.health (production)

## Pull Request Guidelines

1. Feature PRs → Target `develop`
2. Release PRs → From `develop` to `staging`
3. Production PRs → From `staging` to `main`
4. Hotfix PRs → Target `main`, then backport

## Commit Message Format

```
type: brief description

- Detailed change 1
- Detailed change 2

Fixes #issue-number
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Setting Up Locally

```bash
# Set develop as default branch
git checkout develop

# Configure git to push to develop by default
git config push.default current

# Set upstream
git branch --set-upstream-to=origin/develop develop
```