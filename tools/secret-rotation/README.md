# Secret Rotation Automation

Automated secret rotation system for Aether services with scheduling, dashboard, and CLI tools.

## 🚀 Features

### 1. **Cloudflare Secret Rotation**
- List all Cloudflare Workers secrets
- Rotate individual secrets via wrangler CLI
- Generate cryptographically secure random secrets
- Rotation logging and reporting

### 2. **GitHub Token Rotation**
- Automated token deletion and creation
- API-based rotation (requires master token)
- Token management and tracking

### 3. **Stripe Key Rotation**
- Automated secret key creation
- Manual cleanup notification (Stripe limitation)
- Key listing and management

### 4. **Secret Rotation Scheduler**
- Priority-based rotation schedule (high/medium/low)
- Configurable rotation intervals (90d/180d/365d)
- Due rotation detection and reporting
- Force rotation capability

### 5. **Secret Rotation Dashboard**
- Visual web interface for monitoring
- Real-time status display
- One-click force rotation
- Rotation log viewer

## 📦 Installation

```bash
cd C:\Users\adamm\Aether\tools\secret-rotation
npm install
```

## 🔧 Usage

### CLI Commands

#### Cloudflare Secret Management
```bash
# List all Cloudflare secrets
npm run list-cloudflare

# Rotate a specific secret
npm run rotate-cloudflare STRIPE_SECRET_KEY "new_secret_value"
```

#### Scheduler Commands
```bash
# Check for due rotations
npm run check

# Rotate all due secrets
npm run rotate-due

# Show rotation summary
npm run summary

# Show full schedule
npm run schedule

# Force rotation of a specific secret
npm run force STRIPE_SECRET_KEY
```

#### Reporting
```bash
# Generate rotation report
npm run report

# View rotation log
npm run log
```

### Web Dashboard

Open `dashboard.html` in a browser to access the visual dashboard:
- View all monitored secrets
- Check rotation status
- Force rotation with one click
- View rotation logs

## 📋 Rotation Schedule

### High Priority (90 days)
- `STRIPE_SECRET_KEY` - Payment processing
- `GITHUB_TOKEN` - Repository access
- `CLOUDFLARE_API_TOKEN` - Infrastructure

### Medium Priority (180 days)
- `KRAKEN_API_SECRET` - Trading
- `NOTION_API_TOKEN` - Integration
- `SENTRY_DSN` - Error monitoring

### Low Priority (365 days)
- `BRIDGE_API_TOKEN` - Internal API
- `ATOMIND_DEVIN_SECRET` - Agent credentials
- `ATOMIND_GEMINI_SECRET` - Agent credentials
- `ATOMIND_VIKTOR_SECRET` - Agent credentials

## 🔐 Security Features

### Cryptographically Secure Secrets
- Uses `crypto.randomBytes(32)` for secure random generation
- 64-character hexadecimal secrets
- No weak or predictable patterns

### Rotation Logging
- All rotations logged with timestamps
- Success/failure tracking
- JSON-based log storage

### Priority-Based Rotation
- High-priority secrets rotated quarterly
- Medium-priority secrets semi-annually
- Low-priority secrets annually

### Manual Intervention Points
- GitHub rotation requires master token
- Stripe rotation requires manual dashboard cleanup
- Cloudflare rotation is fully automated

## 🚀 Integration with CI/CD

### GitHub Actions Example
```yaml
name: Rotate Secrets
on:
  schedule:
    - cron: '0 0 1 * *'  # Monthly check
jobs:
  check-rotations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd tools/secret-rotation && npm install
      - name: Check for due rotations
        run: cd tools/secret-rotation && npm run check
      - name: Rotate due secrets
        run: cd tools/secret-rotation && npm run rotate-due
      - name: Generate report
        run: cd tools/secret-rotation && npm run report
```

### Cloudflare Workers Cron
```javascript
// In your worker
addEventListener('scheduled', (event) => {
  event.waitUntil(handleSecretRotation(event));
});

async function handleSecretRotation(event) {
  // Call scheduler API to check and rotate
  const response = await fetch('https://your-api.com/rotate-due');
  console.log('Secret rotation result:', response);
}
```

## 📊 Monitoring

### Dashboard Metrics
- Total monitored secrets
- Secrets due for rotation
- Overdue secrets
- Rotation success rate
- Next rotation dates

### API Endpoints (Future)
- `GET /api/secrets` - List all secrets
- `GET /api/secrets/due` - Get due rotations
- `POST /api/secrets/rotate` - Rotate a secret
- `GET /api/secrets/schedule` - Get rotation schedule
- `GET /api/secrets/logs` - Get rotation logs

## ⚠️ Limitations

### Manual Intervention Required
- **GitHub**: Requires master token for rotation
- **Stripe**: Requires manual deletion of old keys in dashboard
- **Google Account**: Password rotation must be manual

### Current Scope
- **Cloudflare**: Fully automated
- **GitHub**: API-based (requires master token)
- **Stripe**: Partially automated (creation only)
- **Other services**: Requires custom implementation

## 🔧 Configuration

### Rotation Schedule
Edit `scheduler.js` to customize:
- Rotation intervals
- Priority levels
- Secret names

### Secret Generation
The default secret generator uses:
- 32 random bytes
- Hexadecimal encoding
- 64-character output

Customize `generateSecret()` in `scheduler.js` for different formats.

## 🛡️ Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate regularly** - Follow the schedule
3. **Monitor logs** - Check for failed rotations
4. **Test rotations** - Verify before production use
5. **Backup secrets** - Keep secure backups during rotation
6. **Update all systems** - Update code/config after rotation

## 📞 Support

For issues or questions:
- Check `SECRET_ROTATION_GUIDE.md` for manual rotation steps
- Review rotation logs for errors
- Test with `npm run check` before production rotation

## 📝 Files

- `secret-rotation.js` - Core rotation logic
- `scheduler.js` - Rotation scheduling
- `dashboard.html` - Web dashboard
- `rotation-schedule.json` - Schedule state (auto-generated)
- `rotation-log.json` - Rotation history (auto-generated)
- `package.json` - Dependencies and scripts

---

**Last Updated:** 2026-06-14
**Generated by:** Devin Security Automation
