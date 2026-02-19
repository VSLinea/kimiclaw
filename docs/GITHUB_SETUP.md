# GitHub Setup Guide

This guide walks through setting up GitHub as the canonical source of truth for the Foundation platform.

## Prerequisites

- GitHub account
- GitHub CLI (`gh`) installed locally
- Git configured with your credentials

## Step 1: Authenticate with GitHub

```bash
# Login to GitHub
ght auth login

# Follow prompts:
# - Choose HTTPS or SSH
# - Authenticate via browser or token
```

## Step 2: Create GitHub Repository

### Option A: Create via GitHub CLI (Recommended)

```bash
cd /root/.openclaw/workspace

# Create public repository
ght repo create foundation-platform --public --source=. --remote=origin --push

# Or create private repository
ght repo create foundation-platform --private --source=. --remote=origin --push
```

### Option B: Create via GitHub Web UI

1. Go to https://github.com/new
2. Enter repository name: `foundation-platform`
3. Choose Public or Private
4. **Do NOT initialize with README** (we already have one)
5. Click "Create repository"
6. Follow the push instructions:

```bash
cd /root/.openclaw/workspace
git remote add origin https://github.com/YOUR_USERNAME/foundation-platform.git
git branch -M main
git push -u origin main
```

## Step 3: Configure Branch Protection

```bash
# Set default branch
ght repo edit --default-branch main

# Enable branch protection (via web UI or API)
# Go to: Settings → Branches → Add rule
```

### Required Branch Protection Rules

Navigate to `https://github.com/YOUR_USERNAME/foundation-platform/settings/branches`:

1. **Add rule for `main` branch:**
   - ☑️ Require a pull request before merging
     - ☑️ Require approvals (1)
   - ☑️ Require status checks to pass
     - ☑️ Require branches to be up to date before merging
     - Status checks: `lint-and-typecheck`, `backend-tests`, `mobile-build-android`
   - ☑️ Include administrators

## Step 4: Configure Repository Settings

### General Settings

Navigate to `https://github.com/YOUR_USERNAME/foundation-platform/settings`:

- **Features:**
  - ☑️ Issues
  - ☑️ Discussions
  - ☑️ Projects
  - ☑️ Wiki (optional)
  - ☐ Sponsorships (unless applicable)

- **Pull Requests:**
  - ☑️ Allow merge commits
  - ☑️ Allow squash merging (recommended)
  - ☑️ Allow rebase merging
  - ☑️ Always suggest updating pull request branches
  - ☑️ Automatically delete head branches

### Secrets and Variables

Navigate to `https://github.com/YOUR_USERNAME/foundation-platform/settings/secrets/actions`:

Add the following secrets:

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `CLERK_SECRET_KEY` | Clerk API secret key | Backend auth |
| `CLERK_PUBLISHABLE_KEY` | Clerk public key | Mobile app |
| `DATABASE_URL` | Production database URL | Staging deploy |
| `DOCKER_USERNAME` | Docker Hub username | Image push |
| `DOCKER_PASSWORD` | Docker Hub password | Image push |

## Step 5: Set Up GitHub Actions

The CI workflow is already in `.github/workflows/ci.yml`.

### Verify Workflow

After pushing, check:
```bash
gh workflow list
```

### Required Workflow Status Checks

Ensure these workflows pass before merging:

1. **lint-and-typecheck** - Code quality
2. **backend-tests** - API tests
3. **mobile-build-android** - Mobile compilation
4. **security-scan** - Vulnerability scanning

## Step 6: Create Initial Pull Request

Even though you're the maintainer, practice the workflow:

```bash
# Create a feature branch
git checkout -b docs/update-readme

# Make a small change
echo "## Contributors" >> README.md

# Commit and push
git add README.md
git commit -m "docs: add contributors section"
git push -u origin docs/update-readme

# Create PR via CLI
ght pr create --title "docs: add contributors section" \
  --body "Adding contributors section to README"

# Or open browser to create PR
ght pr create --web
```

## Step 7: Verify CI/CD Pipeline

1. Push a test branch
2. Create PR
3. Verify all checks run
4. Merge PR
5. Verify deployment (if configured)

## GitHub Web Editing Workflow

### Quick Hotfix via GitHub UI

1. Navigate to file in repository
2. Click pencil (✏️) icon
3. Make edits
4. **Select "Create a new branch for this commit"**
5. Click "Propose changes"
6. Create PR
7. Merge after CI passes

### Review PR Changes

1. Go to Pull Requests tab
2. Click on PR
3. Click "Files changed" tab
4. Review changes line by line
5. Add comments or approve
6. Merge when ready

## Repository Hygiene Checklist

- [ ] Repository created on GitHub
- [ ] Code pushed to main branch
- [ ] Branch protection rules configured
- [ ] Required status checks enabled
- [ ] Secrets added to repository
- [ ] Issues enabled
- [ ] PR template working
- [ ] CI/CD pipeline verified
- [ ] First PR merged successfully

## Troubleshooting

### Authentication Issues

```bash
# Check auth status
gh auth status

# Re-authenticate
gh auth login

# Or use token
export GITHUB_TOKEN=your_token_here
```

### Push Rejected

```bash
# If push is rejected, pull first
git pull origin main --rebase
git push origin main
```

### Large File Push Fails

```bash
# If files are too large, check .gitignore
cat .gitignore

# Remove large files from git cache
git rm --cached path/to/large/file
```

## Next Steps

After GitHub setup is complete:

1. **Invite team members** as collaborators
2. **Set up project boards** for task tracking
3. **Configure notifications** for PRs and issues
4. **Set up deployment environments** (staging/production)
5. **Configure dependabot** for dependency updates

## Reference Links

- [GitHub Docs](https://docs.github.com)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
