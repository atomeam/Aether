# 🧹 Sprint Page Content Cleaner

Removes outdated content from Sprint pages (email warm-up tables, chore lists, etc.).

## 🛠️ System Built

**Content Cleaner** (`content-cleaner.js`)
- Removes email warm-up tables
- Removes email infrastructure tasks
- Removes chore lists
- Custom cleaning rules
- Cleaning statistics

## 🎮 Usage

### Clean Sprint Page

```bash
cd tools/content-cleaner

# Clean entire Sprint page
npm run clean <file-path>
```

### Clean Specific Content Type

```bash
# Clean email warm-up content
npm run clean-type <file-path> email-warmup

# Clean email infrastructure content
npm run clean-type <file-path> email-infra

# Clean chore content
npm run clean-type <file-path> chores
```

### Statistics

```bash
# Get cleaning statistics
npm run stats
```

### Custom Rules

```bash
# Add custom cleaning rule
npm run add-rule <name> <pattern> <description> [severity]
```

## 📊 What This Solves

**Problem:** The Sprint page still has old email warm-up tables buried lower down that contradict the new no-email direction.

**Solution:** This system provides:
- Automated removal of email warm-up tables
- Removal of email infrastructure tasks
- Removal of chore lists
- Custom cleaning rules
- Cleaning statistics

## 🔧 Built-in Cleaning Rules

1. **Email Warm-up Tables** - Removes "Week X: Y emails" patterns
2. **Email Infrastructure Tasks** - Removes domain registration, SPF, DKIM, DMARC, sending service references
3. **Outdated Chore Lists** - Removes chore, setup, configure, install references
4. **Email Warm-up References** - Removes warmup and email warm references

## 📋 Files Created

- content-cleaner.js (200+ lines)
- package.json

**Total:** 2 files, 200+ lines of code
