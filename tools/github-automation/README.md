# 🔀 GitHub Automation System

Automates GitHub operations without manual intervention - auto-PR, auto-merge, branch management, and alternative platform support.

## 🛠️ Systems Built (2)

1. **🔀 GitHub Automation** (`github-automation.js`)
   - Auto-create PRs with standard commit messages
   - Auto-merge PRs with checks and reviews validation
   - Auto-create and push branches
   - Auto-commit with formatted messages
   - Operations history and statistics
   - **Impact:** Fully automated GitHub workflow

2. **🔄 Alternative Git Platform** (`alt-platform.js`)
   - Support for GitLab (glab CLI)
   - Support for Bitbucket (bb CLI)
   - Platform switching
   - Unified MR/PR creation
   - Platform-specific configuration
   - **Impact:** Platform flexibility and alternatives

## 🎮 Usage

### GitHub Automation

```bash
cd tools/github-automation

# Auto-create PR
npm run create-pr <branch> <title> <body> [labels]

# Auto-merge PR
npm run merge-pr <pr-number> [method]

# Auto-create branch
npm run create-branch <branch-name> [from-branch]

# Auto-commit with standard message
npm run commit <files> <message>

# Enable auto-merge
npm run enable-auto-merge

# Disable auto-merge
npm run disable-auto-merge

# Get statistics
npm run stats

# Get operations history
npm run history
```

### Alternative Platforms

```bash
# Switch platform
npm run switch gitlab

# Configure platform
npm run configure gitlab '{"url":"https://gitlab.com"}'

# Create MR/PR
npm run create-mr <branch> <title> <body> [labels]

# Auto-merge
npm run merge <mr-number> [method]

# Get current platform
npm run current

# Get platform config
npm run config gitlab
```

## 🚀 What This Solves

**Problem:** Manual GitHub operations require constant intervention.

**Solution:** This system provides:
- **Auto-PR Creation** - Automatically create PRs with standard messages
- **Auto-Merge** - Automatically merge when checks/reviews pass
- **Branch Management** - Auto-create and push branches
- **Standard Commit Messages** - Consistent formatting with Devin attribution
- **Alternative Platforms** - GitLab and Bitbucket support
- **Operations History** - Track all automated operations
- **Statistics** - Monitor success rates and patterns

## 🔧 Auto-Merge Safety

The auto-merge system includes safety checks:
- **Mergeable check** - Only merge if PR is mergeable
- **Review check** - Only merge if approved (when required)
- **Checks check** - Only merge if all checks pass
- **Configurable** - Enable/disable as needed

## 📊 Standard Commit Message Format

All auto-commits use this format:
```
<message>

Generated with [Devin](https://cli.devin.ai/docs)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
```

## 🔄 Platform Support

**GitHub:**
- CLI: `gh`
- Auto-merge: Yes
- Checks: Yes
- Reviews: Yes

**GitLab:**
- CLI: `glab`
- Auto-merge: Yes
- Checks: Yes
- Reviews: Yes

**Bitbucket:**
- CLI: `bb`
- Auto-merge: Yes
- Checks: Yes
- Reviews: Yes

## 📋 Files Created

- github-automation.js (350+ lines)
- alt-platform.js (300+ lines)
- package.json

**Total:** 3 files, 650+ lines of code

## 🎯 How to Use This

### For Your Current Workflow

1. **Enable auto-merge** (if you want):
   ```bash
   npm run enable-auto-merge
   ```

2. **Auto-create PR** after committing:
   ```bash
   npm run create-pr feature/test "Test PR" "Description"
   ```

3. **Auto-merge** when ready:
   ```bash
   npm run merge-pr 123
   ```

### For Alternative Platforms

If GitHub has issues, switch to GitLab or Bitbucket:

```bash
# Switch to GitLab
npm run switch gitlab

# Configure GitLab URL
npm run configure gitlab '{"url":"https://gitlab.com/atomeam/Aether"}'

# Create MR
npm run create-mr feature/test "Test" "Description"

# Merge MR
npm run merge 123
```

## 🔐 Security

- **Read-only access** - No write permissions beyond what you authorize
- **Configurable** - Enable/disable features as needed
- **Safety checks** - Auto-merge validates checks and reviews
- **Operations tracking** - Full audit trail of all operations
