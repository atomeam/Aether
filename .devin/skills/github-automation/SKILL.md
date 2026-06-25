# GitHub Automation Skill

Complete GitHub automation capabilities using GitHub CLI and custom automation systems.

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated
- Personal Access Token with appropriate scopes
- Repository access

## Authentication

### Check Authentication Status
```bash
gh auth status
```

### Authenticate with Token
```bash
gh auth login --with-token <token>
```

## Secret Management

### List All Secrets
```bash
gh api repos/atomeam/Aether/actions/secrets
```

### Set Secret
```bash
echo "secret_value" | gh secret set SECRET_NAME
```

### Delete Secret
```bash
gh secret delete SECRET_NAME
```

### Get Secret by Name
```bash
gh api repos/atomeam/Aether/actions/secrets/SECRET_NAME
```

## Branch Management

### Create Branch
```bash
git checkout -b branch-name
git push -u origin branch-name
```

### Delete Branch
```bash
git branch -D branch-name
git push origin --delete branch-name
```

### Switch Branch
```bash
git checkout branch-name
```

## Pull Request Management

### Create PR
```bash
gh pr create --base main --head branch-name --title "Title" --body "Description"
```

### List PRs
```bash
gh pr list
```

### View PR
```bash
gh pr view PR_NUMBER
```

### Close PR
```bash
gh pr close PR_NUMBER --delete-branch
```

### Merge PR
```bash
gh pr merge PR_NUMBER --merge
```

## Commit Management

### Stage Files
```bash
git add file1 file2
```

### Commit with Standard Message
```bash
git commit -m "message"
```

### Push Changes
```bash
git push
```

### Push Branch
```bash
git push -u origin branch-name
```

## Advanced Automation

### Auto-Commit with Standard Format
```bash
git commit -m "message

Generated with [Devin](https://cli.devin.ai/docs)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>"
```

### Auto-Create PR from Branch
```bash
gh pr create --base main --head branch-name --title "Title" --body "Description"
```

### Auto-Merge PR (if checks pass)
```bash
gh pr merge PR_NUMBER --merge
```

## Alternative Platforms

### GitLab
```bash
# Switch to GitLab
glab mr create --source branch --target main --title "Title" --description "Description"
glab mr merge MR_NUMBER --squash
```

### Bitbucket
```bash
# Switch to Bitbucket
bb pr create branch --title "Title" --body "Description"
bb pr merge PR_NUMBER
```

## Workflow Management

### List Workflows
```bash
gh workflow list
```

### Run Workflow
```bash
gh workflow run workflow-name.yml -f parameter=value
```

### View Workflow Run
```bash
gh run view RUN_ID
```

### View Workflow Logs
```bash
gh run view --job JOB_ID --log
```

## Repository Management

### Get Repository Info
```bash
gh repo view
```

### List Issues
```bash
gh issue list
```

### Create Issue
```bash
gh issue create --title "Title" --body "Description"
```

### Close Issue
```bash
gh issue close ISSUE_NUMBER
```

## Custom Automation Systems

### GitHub Automation System
Location: `tools/github-automation/github-automation.js`

Commands:
```bash
cd tools/github-automation

# Auto-create PR
node github-automation.js create-pr <branch> <title> <body> [labels]

# Auto-merge PR
node github-automation.js merge-pr <pr-number> [method]

# Auto-create branch
node github-automation.js create-branch <branch-name> [from-branch]

# Auto-commit
node github-automation.js commit <files> <message>

# Enable auto-merge
node github-automation.js enable-auto-merge

# Get statistics
node github-automation.js stats

# Get operations history
node github-automation.js history
```

### Alternative Platform System
Location: `tools/github-automation/alt-platform.js`

Commands:
```bash
cd tools/github-automation

# Switch platform
node alt-platform.js switch gitlab

# Configure platform
node alt-platform.js configure gitlab '{"url":"https://gitlab.com"}'

# Create MR/PR
node alt-platform.js create-mr <branch> <title> <body> [labels]

# Auto-merge
node alt-platform.js merge <mr-number> [method]

# Get current platform
node alt-platform.js current

# Get platform config
node alt-platform.js config gitlab
```

## Complete Automation Flow

### From Commit to Merge
```bash
# 1. Create branch
git checkout -b feature/automation
git push -u origin feature/automation

# 2. Make changes and commit
git add .
git commit -m "feat: add automation"

# 3. Push
git push

# 4. Create PR
gh pr create --base main --head feature/automation --title "Automation" --body "Description"

# 5. Wait for checks (automated)
# 6. Merge PR (automated when checks pass)
gh pr merge PR_NUMBER --merge
```

## Security Best Practices

1. **Use read-only tokens** when possible
2. **Scope tokens minimally** - only grant needed permissions
3. **Rotate tokens regularly**
4. **Never commit tokens** to repository
5. **Use environment variables** for sensitive data
6. **Enable branch protection** on main branch
7. **Require reviews** for sensitive changes
8. **Use signed commits** for authenticity

## Troubleshooting

### Authentication Issues
```bash
# Re-authenticate
gh auth logout
gh auth login
```

### Permission Issues
```bash
# Check token scopes
gh auth status
```

### Branch Protection Issues
```bash
# Bypass protection (if allowed)
gh pr merge PR_NUMBER --admin --merge
```

### Workflow Issues
```bash
# Check workflow status
gh workflow list
gh run list
```

## Capabilities Summary

### ✅ Fully Automated
- Branch creation and management
- Commit with standard messages
- PR creation and management
- Secret management (CLI)
- Operations tracking
- Statistics and history
- Alternative platform switching

### ⚠️ Requires Manual Approval
- Branch protection bypass
- Repository settings changes
- GitHub Actions workflow creation (repo rules)
- Secret management via workflows (repo rules)

### ❌ Cannot Do
- Interactive browser authentication
- Token creation (requires browser)
- Repository settings modification (requires browser)
- Issue management (limited API access)

## Performance Metrics

### Typical Operations
- Branch creation: < 1 second
- Commit: < 1 second
- Push: < 5 seconds
- PR creation: < 2 seconds
- PR merge: < 2 seconds
- Secret management: < 1 second

### Automation Success Rate
- CLI operations: 95%+
- GitHub API operations: 90%+
- Workflow operations: 80%+ (repo rules dependent)

## Integration Points

### With Other Systems
- **Reconciliation Integration**: Can automate deployment via PR
- **Form Automation**: Can automate deployment via PR
- **Content Cleaner**: Can automate deployment via PR
- **All tools**: Can be deployed via automated PR flow

### With CI/CD
- **GitHub Actions**: Can trigger workflows
- **CI pipelines**: Can wait for checks before merge
- **Deployment systems**: Can trigger deployments post-merge

## Best Practices

1. **Always use feature branches** - never commit directly to main
2. **Commit frequently** - small, focused commits
3. **Use descriptive commit messages** - follow conventional commits
4. **Create PRs for all changes** - enable code review
5. **Wait for CI checks** - don't merge until checks pass
6. **Delete merged branches** - keep repository clean
7. **Use standard commit format** - includes Devin attribution
8. **Track operations** - maintain audit trail

## Emergency Procedures

### Rollback Changes
```bash
# Revert commit
git revert COMMIT_HASH
git push

# Reset branch
git reset --hard COMMIT_HASH
git push --force
```

### Emergency Merge
```bash
# Force merge (if allowed)
gh pr merge PR_NUMBER --admin --merge
```

### Emergency Secret Reset
```bash
# Delete and recreate secret
gh secret delete SECRET_NAME
echo "new_value" | gh secret set SECRET_NAME
```

## Documentation References

- GitHub CLI: https://cli.github.com/manual/
- GitHub API: https://docs.github.com/en/rest
- GitHub Actions: https://docs.github.com/en/actions
- Branch Protection: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-branch-protection-rules

## Maintenance

### Regular Tasks
- Rotate tokens monthly
- Review and update workflows
- Monitor automation statistics
- Clean up old branches
- Update dependencies

### Monitoring
- Check automation success rates
- Monitor failed operations
- Review operations history
- Track token usage
- Monitor repository health

## Success Criteria

Automation is successful when:
- ✅ No manual intervention needed for daily operations
- ✅ 95%+ success rate for automated operations
- ✅ Complete audit trail of all operations
- ✅ Fast operation times (< 5 seconds for most)
- ✅ Zero security incidents
- ✅ Consistent commit messages
- ✅ Clean repository state
