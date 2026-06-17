# Trial Monitor - Quick Start Guide

## What This Does

The trial monitoring service tracks your free trials and alerts you before they charge your Cash App card.

## How to Use

### 1. Add a Trial

```bash
cd tools/trial-monitor
npm run add
```

You'll be asked for:
- Service name (e.g., CircleCI, Datadog)
- Trial duration in days (e.g., 14)
- Estimated savings (e.g., $99)
- Vendor timezone (e.g., America/New_York)

### 2. List Your Trials

```bash
npm run list
```

Shows all your trials with danger dates and days remaining.

### 3. Run One-Time Check

```bash
npm run check
```

Checks all trials and shows which are approaching or overdue.

### 4. Start Continuous Monitoring

```bash
npm start
```

Runs in the background, checking trials every hour and sending notifications.

### 5. Remove a Trial

```bash
npx tsx runner.ts remove <trial_id>
```

## Example Workflow

```bash
# Add a CircleCI trial (14 days)
npm run add
# Service name: CircleCI
# Duration: 14
# Savings: 99
# Timezone: America/New_York

# List trials
npm run list

# Check trials
npm run check

# Start monitoring
npm start
```

## What Happens

- **When you add a trial**: System calculates the danger date (start date + duration)
- **Every hour**: System checks if any trials are approaching danger date
- **48 hours before**: Sends notification "Trial due in 48 hours"
- **24 hours before**: Sends urgent notification "Trial due in 24 hours"
- **Overdue**: Sends urgent notification "Trial was due on [date]"

## Notifications

Currently, notifications are logged to console. To enable real notifications:

1. **Set up Victus runtime** on your HP Victus laptop
2. **Configure notification channels** in environment variables:
   - `NOTION_ENABLED=true`
   - `NOTION_DATABASE_ID=your_database_id`
   - `EMAIL_ENABLED=true`
   - `EMAIL_RECIPIENT=your@email.com`
   - `SLACK_ENABLED=true`
   - `SLACK_WEBHOOK_URL=your_webhook_url`

## Trial Data

Trials are stored in `trials.json` in the trial-monitor directory. You can edit this file directly if needed.

## Next Steps

1. **Add your current trials** using `npm run add`
2. **Test the check** using `npm run check`
3. **Start monitoring** using `npm start`
4. **Configure notifications** when ready for real alerts

## Troubleshooting

**No trials found**: Add trials first with `npm run add`

**VictusBridge errors**: Make sure Victus runtime is running at `http://localhost:8080`

**Notifications not sending**: Check environment variables and VictusBridge connection
