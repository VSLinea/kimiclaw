# GitHub Workflow Guide

This document describes the Git-based development workflow for the Foundation platform.

## Table of Contents

- [Repository Structure](#repository-structure)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Pull Request Process](#pull-request-process)
- [Reviewing Changes in PRs](#reviewing-changes-in-prs)
- [Editing Files Directly in GitHub](#editing-files-directly-in-github)
- [Reverting a Bad Merge](#reverting-a-bad-merge)
- [Release Tagging Process](#release-tagging-process)
- [CI/CD Requirements](#cicd-requirements)

---

## Repository Structure

```
 foundation-platform/
 ├── .github/
 │   └── workflows/
 │       └── ci.yml          # CI pipeline
 ├── apps/
 │   └── mobile/             # Flutter mobile app
 ├── services/
 │   └── api/                # Fastify backend API
 ├── packages/
 │   └── shared/             # Shared types and utilities
 ├── infra/
 │   ├── docker-compose.yml
 │   └── docker-compose.staging.yml
 ├── docs/
 │   ├── FOUNDATION_PRD.md
 │   ├── ARCHITECTURE.md
 │   ├── SECURITY.md
 │   ├── API_CONTRACT.md
 │   ├── DEV_GUIDE.md
 │   ├── RUNBOOK.md
 │   ├── OBSERVABILITY.md
 │   ├── GITHUB_WORKFLOW.md   # This file
 │   └── EVIDENCE.md
 ├── scripts/
 │   └── *.sh
 ├── .env.example
 ├── .gitignore
 ├── package.json
 └── README.md
```

---

## Branch Naming Conventions

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features or enhancements | `feature/hello-entity-crud` |
| `bugfix/` | Bug fixes | `bugfix/auth-middleware` |
| `hotfix/` | Critical production fixes | `hotfix/security-patch` |
| `docs/` | Documentation updates | `docs/api-contract-update` |
| `refactor/` | Code refactoring | `refactor/entity-service` |
| `chore/` | Maintenance tasks | `chore/update-dependencies` |

### Branch Naming Rules

1. **Use lowercase with hyphens**: `feature/user-authentication`
2. **Include issue/ticket number if applicable**: `feature/TT-123-user-login`
3. **Keep it descriptive but concise**: Max 50 characters
4. **No personal names**: Use purpose, not author

---

## Pull Request Process

### 1. Create a Feature Branch

```bash
# Start from latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Push branch to remote
git push -u origin feature/your-feature-name
```

### 2. Make Changes and Commit

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add user authentication middleware

- Implement JWT verification
- Add Clerk webhook handlers
- Update RBAC middleware

Closes #123"
```

**Conventional Commit Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

### 3. Push and Create PR

```bash
# Push changes
git push origin feature/your-feature-name

# Create PR via GitHub CLI (optional)
gh pr create --title "feat: add user authentication" \
  --body-file .github/pull_request_template.md
```

### 4. PR Template

Every PR must include:

```markdown
## Summary
Brief description of changes

## Changes
- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

## Acceptance Criteria
- [ ] Feature works as described
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Evidence
See /docs/EVIDENCE.md for:
- Commands run
- Test results
- Screenshots (if applicable)

## Related Issues
Closes #123

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All CI checks passing
```

### 5. Merge Requirements

Before merging:
- [ ] At least 1 approval from code owner
- [ ] All CI checks passing
- [ ] No merge conflicts
- [ ] PR title follows conventional commits
- [ ] Evidence documented in EVIDENCE.md

---

## Reviewing Changes in PRs

### Via GitHub Web Interface

1. **Navigate to PR**: Go to Pull Requests → Click on PR

2. **Review Tab**: Click "Files changed" tab

3. **Review Methods**:
   - **Single comments**: Click line number → "Add single comment"
   - **Review comments**: Click "Review changes" → Select:
     - `Comment`: General feedback
     - `Approve`: LGTM, ready to merge
     - `Request changes`: Issues must be fixed

4. **Suggest Changes**: Click icon next to line number to propose code changes

5. **Resolve Conversations**: Mark comments as resolved after addressing

### Review Checklist

- [ ] Code follows project conventions
- [ ] No obvious bugs or security issues
- [ ] Tests cover new functionality
- [ ] Documentation is accurate
- [ ] Performance implications considered
- [ ] Error handling is appropriate

---

## Editing Files Directly in GitHub

For quick hotfixes without local setup:

### 1. Navigate to File

```
Repository → Click file path → Select file
```

### 2. Edit File

1. Click pencil icon (✏️) in top-right
2. Make changes in editor
3. Add commit message at bottom
4. Select commit option:
   - **Commit directly to main**: ⚠️ Only for docs/hotfixes
   - **Create new branch**: ✅ Recommended - starts PR workflow

### 3. Create PR from Edit

If you selected "Create new branch":
1. GitHub prompts to "Propose changes"
2. Click "Propose changes"
3. Fill PR template
4. Submit PR for review

### When to Use Direct Edit

✅ **Appropriate:**
- Documentation typos
- README updates
- Configuration tweaks
- Comment fixes

❌ **Not Appropriate:**
- Complex logic changes
- Multi-file changes
- Changes requiring tests
- Security-sensitive code

---

## Reverting a Bad Merge

### Option 1: Revert PR (Recommended)

```bash
# Via GitHub
1. Go to merged PR
2. Click "Revert" button
3. This creates new PR that undoes changes
4. Review and merge revert PR
```

```bash
# Via command line
git checkout main
git pull origin main

# Find merge commit hash
git log --oneline -10

# Revert merge commit
git revert -m 1 <merge-commit-hash>

# Push revert
git push origin main
```

### Option 2: Reset (⚠️ Dangerous)

Only use if revert is not possible:

```bash
# Identify last good commit
git log --oneline

# Reset to that commit (local only)
git reset --hard <good-commit-hash>

# Force push (⚠️ Rewrites history)
git push origin main --force-with-lease
```

**⚠️ Warning**: Force push can break other developers' work. Coordinate with team first.

### Option 3: Hotfix Branch

If main is broken but you need to preserve some changes:

```bash
# Create hotfix from last known good commit
git checkout -b hotfix/rollback-feature <good-commit-hash>

# Cherry-pick fixes you want to keep
git cherry-pick <fix-commit-hash>

# Merge hotfix to main via PR
git push origin hotfix/rollback-feature
# Create PR and merge
```

---

## Release Tagging Process

### Semantic Versioning

Format: `vMAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Steps

1. **Update CHANGELOG.md**

```markdown
## [1.2.0] - 2024-02-19

### Added
- New feature X
- Support for Y

### Fixed
- Bug in Z

### Changed
- Improved performance of W
```

2. **Create Release Branch** (for major/minor)

```bash
git checkout -b release/v1.2.0
# Final testing, version bumps
```

3. **Tag Release**

```bash
# Via command line
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0
```

Or via GitHub:
```
Repository → Releases → Draft new release
- Choose tag: v1.2.0
- Target: main
- Title: v1.2.0
- Description: Copy from CHANGELOG
```

4. **Verify CI/CD**

- Tag push triggers release workflow
- Docker images built with tag
- Deployment to staging

### Pre-releases

For beta/RC versions:

```bash
git tag -a v1.2.0-beta.1 -m "Beta release 1.2.0-beta.1"
git push origin v1.2.0-beta.1
```

---

## CI/CD Requirements

### Required Checks (Must Pass Before Merge)

```yaml
# .github/workflows/ci.yml
jobs:
  lint-and-typecheck:
    # Must pass
    
  backend-tests:
    # Must pass
    
  mobile-build:
    # Must pass
    
  security-scan:
    # Must pass
```

### Branch Protection Rules

Configure in GitHub:

```
Settings → Branches → Add rule for "main"
- Require pull request reviews before merging
- Require status checks to pass
- Require branches to be up to date before merging
- Include administrators
```

### Automated Workflows

| Event | Workflow | Purpose |
|-------|----------|---------|
| PR opened | `ci.yml` | Run tests, lint, build |
| PR merged | `deploy-staging.yml` | Deploy to staging |
| Tag pushed | `release.yml` | Create release, deploy prod |
| Scheduled | `security-scan.yml` | Daily dependency scan |

---

## Quick Reference

| Task | Command |
|------|---------|
| New feature | `git checkout -b feature/name` |
| Commit | `git commit -m "feat: description"` |
| Push | `git push -u origin branch-name` |
| Update branch | `git pull origin main` |
| Create PR | `gh pr create` or GitHub UI |
| Revert merge | GitHub "Revert" button |
| Tag release | `git tag -a v1.0.0 -m "Release"` |

---

## Emergency Contacts

| Issue | Contact |
|-------|---------|
| CI/CD failure | @devops-team |
| Security incident | @security-team |
| Merge conflict help | @tech-leads |
| Access issues | @admin |
