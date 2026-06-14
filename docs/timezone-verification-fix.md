# Timezone & Verification Fix Specification

## Problem Statement

**Current State:**
- Billing happens in vendor timezone
- `dangerDate` / "due today" sweep runs in fixed timezone (likely UTC or local)
- Off-by-one error means sweep fires **after** charge has already occurred
- No verification that cancellation actually succeeded (status flipped, confirmation received)
- "Submitted" ≠ "Cancelled"

**Impact:**
- Direct financial loss (most expensive bug in system)
- False confidence in cancellation success
- No recourse when cancellation fails silently

## Solution Architecture

### 1. Timezone-Aware Trial Records

**Schema Changes:**
```typescript
interface TrialRecord {
  // ... existing fields ...
  vendorTimezone: string;        // NEW: IANA timezone (e.g., "America/New_York")
  billingTime: string;            // NEW: HH:MM in vendor timezone
  billingTimezone: string;        // NEW: IANA timezone for billing time
  dangerDate: string;            // MODIFIED: Always in vendor timezone
  lastVerification: string;       // NEW: Last successful verification timestamp
  verificationStatus: string;   // NEW: 'verified' | 'unverified' | 'failed'
  verificationAttempts: number;  // NEW: Number of verification attempts
}
```

**Implementation:**
1. Add `vendorTimezone` field to trial creation (default: service-specific mapping)
2. Add `billingTime` field (extracted from service documentation or email)
3. Calculate `dangerDate` in vendor timezone, not UTC
4. Store all dates in ISO 8601 with timezone offset: `2026-06-28T00:00:00-04:00`

**Service Timezone Mapping:**
```typescript
const SERVICE_TIMEZONES: Record<string, string> = {
  'CircleCI': 'America/Los_Angeles',
  'Datadog': 'America/New_York',
  'MongoDB Atlas': 'UTC',
  'SendGrid': 'America/Denver',
  'GitHub Actions': 'UTC',
  'GitLab CI': 'UTC',
  'Vercel': 'America/New_York',
  'Netlify': 'America/Los_Angeles',
  'AWS': 'UTC',
  'Azure': 'UTC',
  'Google Cloud': 'UTC',
  'Heroku': 'UTC',
  'DigitalOcean': 'UTC',
  'New Relic': 'America/New_York',
  'Sentry': 'UTC',
  'Postman': 'America/Los_Angeles',
  'Slack': 'America/Los_Angeles',
  'Notion': 'America/Los_Angeles',
  'Figma': 'America/Los_Angeles',
  'Adobe': 'America/Los_Angeles',
  'Microsoft': 'America/Los_Angeles'
};
```

### 2. Timezone-Aware Sweep Scheduling

**Sweep Logic Changes:**
```typescript
async scheduleSweep(trial: TrialRecord): Promise<Date> {
  // Convert danger date to UTC for scheduling
  const dangerDate = new Date(trial.dangerDate);
  const bufferHours = trial.service === 'high_risk' ? 24 : 48; // Configurable buffer
  
  // Calculate sweep time in vendor timezone
  const sweepTime = new Date(dangerDate.getTime() - (bufferHours * 60 * 60 * 1000));
  
  // Schedule sweep at vendor timezone equivalent
  return sweepTime;
}

async runSweep(trialId: string): Promise<void> {
  const trial = await getTrial(trialId);
  
  // Verify current time in vendor timezone
  const vendorNow = getVendorTime(trial.vendorTimezone);
  const dangerDate = new Date(trial.dangerDate);
  
  // Check if we're within buffer period in vendor timezone
  const hoursUntilDanger = (dangerDate.getTime() - vendorNow.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilDanger < 0) {
    // Already past danger date - escalate immediately
    await escalateToManual(trialId, 'DANGER_DATE_PASSED');
    return;
  }
  
  if (hoursUntilDanger < trial.bufferHours) {
    // Within buffer - execute cancellation
    await executeCancellation(trialId);
  }
}

function getVendorTime(timezone: string): Date {
  const now = new Date();
  // Convert to vendor timezone
  return new Date(now.toLocaleString('en-US', { timeZone }));
}
```

**Sweep Cadence Strategy:**
```typescript
interface SweepConfig {
  service: string;
  billingTime: string;          // HH:MM in vendor timezone
  timezone: string;              // IANA timezone
  sweepCadence: 'hourly' | 'daily' | 'weekly';
  bufferHours: number;          // Hours before billing to sweep
  highRisk: boolean;            // Requires tighter cadence
}

const SWEEP_CONFIGS: Record<string, SweepConfig> = {
  'CircleCI': {
    billingTime: '00:00',
    timezone: 'America/Los_Angeles',
    sweepCadence: 'hourly',
    bufferHours: 24,
    highRisk: true
  },
  'Datadog': {
    billingTime: '00:00',
    timezone: 'America/New_York',
    sweepCadence: 'hourly',
    bufferHours: 24,
    highRisk: true
  },
  'SendGrid': {
    billingTime: '00:00',
    timezone: 'America/Denver',
    sweepCadence: 'daily',
    bufferHours: 48,
    highRisk: false
  }
};
```

### 3. Cancellation Verification

**Verification Steps:**
```typescript
interface VerificationResult {
  success: boolean;
  method: 'api' | 'rpa' | 'manual_only';
  verifiedAt: string;
  verificationMethod: 'status_check' | 'email_confirmation' | 'account_check';
  confirmationDetails: {
    accountStatus?: string;
    confirmationEmail?: string;
    confirmationNumber?: string;
    screenshot?: string;
  };
  retryCount: number;
}

async verifyCancellation(trialId: string): Promise<VerificationResult> {
  const trial = await getTrial(trialId);
  const result: VerificationResult = {
    success: false,
    method: trial.cancellationMethod,
    verifiedAt: new Date().toISOString(),
    verificationMethod: 'status_check',
    confirmationDetails: {},
    retryCount: 0
  };

  // Step 1: Check account status via API if available
  if (trial.cancellationMethod === 'api') {
    try {
      const accountStatus = await checkAccountStatus(trial);
      if (accountStatus.status === 'cancelled' || accountStatus.status === 'inactive') {
        result.success = true;
        result.verificationMethod = 'status_check';
        result.confirmationDetails.accountStatus = accountStatus.status;
      }
    } catch (error) {
      console.error('API status check failed:', error);
    }
  }

  // Step 2: Check for confirmation email
  if (!result.success) {
    const confirmationEmail = await checkConfirmationEmail(trial);
    if (confirmationEmail) {
      result.success = true;
      result.verificationMethod = 'email_confirmation';
      result.confirmationDetails.confirmationEmail = confirmationEmail.subject;
    }
  }

  // Step 3: Manual verification for RPA/manual_only
  if (!result.success && (trial.cancellationMethod === 'rpa' || trial.cancellationMethod === 'manual_only')) {
    result.verificationMethod = 'account_check';
    result.confirmationDetails.screenshot = await captureAccountScreenshot(trial);
    // Requires human review
    await escalateToManual(trialId, 'MANUAL_VERIFICATION_REQUIRED');
  }

  // Update trial with verification result
  trial.lastVerification = result.verifiedAt;
  trial.verificationStatus = result.success ? 'verified' : 'failed';
  trial.verificationAttempts = (trial.verificationAttempts || 0) + 1;
  
  await putTrial(trial);

  // Retry logic
  if (!result.success && trial.verificationAttempts < 3) {
    await scheduleRetry(trialId, 15 * 60 * 1000); // 15 minutes
  } else if (!result.success) {
    await escalateToManual(trialId, 'VERIFICATION_FAILED');
  }

  return result;
}

async checkAccountStatus(trial: TrialRecord): Promise<{ status: string }> {
  // Service-specific API calls
  switch (trial.service) {
    case 'CircleCI':
      return await checkCircleCIStatus(trial);
    case 'Datadog':
      return await checkDatadogStatus(trial);
    // ... other services
    default:
      throw new Error('No status check implemented for ' + trial.service);
  }
}

async checkConfirmationEmail(trial: TrialRecord): Promise<{ subject: string } | null> {
  // Check email for cancellation confirmation
  const emailScanner = new EmailScanner();
  const results = await emailScanner.scanEmail(trial.userEmail);
  
  const confirmation = results.billingAlerts.find(alert => 
    alert.service === trial.service && 
    alert.alertType === 'cancellation' &&
    alert.dueDate === trial.dangerDate
  );
  
  return confirmation ? { subject: confirmation.originalEmail } : null;
}
```

### 4. Notification & Escalation

**Escalation Rules:**
```typescript
interface EscalationRule {
  condition: string;
  action: string;
  leadTime: number;  // hours
  channel: 'email' | 'slack' | 'notion';
  urgency: 'immediate' | 'urgent' | 'normal';
}

const ESCALATION_RULES: EscalationRule[] = [
  {
    condition: 'verification_failed_3_times',
    action: 'manual_intervention_required',
    leadTime: 0,
    channel: 'email',
    urgency: 'immediate'
  },
  {
    condition: 'manual_only_cancellation',
    action: 'manual_cancellation_required',
    leadTime: 24,
    channel: 'email',
    urgency: 'urgent'
  },
  {
    condition: 'danger_date_passed',
    action: 'emergency_manual_check',
    leadTime: 0,
    channel: 'email',
    urgency: 'immediate'
  },
  {
    condition: 'sweep_failed',
    action: 'retry_sweep',
    leadTime: 1,
    channel: 'slack',
    urgency: 'urgent'
  }
];

async escalateToManual(trialId: string, reason: string): Promise<void> {
  const trial = await getTrial(trialId);
  const rule = ESCALATION_RULES.find(r => r.condition === reason);
  
  if (!rule) {
    console.error('No escalation rule for:', reason);
    return;
  }

  const notification = {
    service: trial.service,
    trialId: trial.id,
    dangerDate: trial.dangerDate,
    reason,
    urgency: rule.urgency,
    actionRequired: rule.action,
    leadTime: rule.leadTime,
    timestamp: new Date().toISOString()
  };

  await sendNotification(notification, rule.channel);
}
```

## Implementation Priority

**Phase 1 - Critical (Must Have):**
1. Add timezone fields to trial schema
2. Implement service timezone mapping
3. Calculate danger dates in vendor timezone
4. Add verification step after cancellation
5. Implement basic escalation (email)

**Phase 2 - High Priority (Should Have):**
1. Implement per-service sweep cadence
2. Add confirmation email checking
3. Implement retry logic for verification
4. Add Slack notification channel
5. Create timezone-aware scheduling

**Phase 3 - Medium Priority (Nice to Have):**
1. Implement RPA screenshot capture
2. Add Notion notification channel
3. Create verification dashboard
4. Implement manual verification workflow
5. Add timezone conversion utilities

## Testing Strategy

**Test Cases:**
1. **Timezone Conversion:** Create trial in PST, verify danger date calculated correctly
2. **Cross-Timezone Billing:** Service bills in EST, sweep runs in PST, verify timing
3. **Verification Success:** Cancel via API, verify status check succeeds
4. **Verification Failure:** Simulate failed cancellation, verify retry and escalation
5. **Escalation Timing:** Trigger manual_only, verify 24h lead time notification
6. **Sweep Cadence:** High-risk service with hourly sweep, verify correct timing
7. **Date Boundary:** Billing at midnight, verify sweep runs before midnight in vendor timezone

**Test Services:**
- Use sandbox services with known billing times
- Test with services in different timezones (UTC, PST, EST, CET)
- Simulate cancellation failures for verification testing

## Acceptance Criteria

1. ✅ All trial records include vendor timezone
2. ✅ Danger dates calculated in vendor timezone
3. ✅ Sweep scheduled in vendor timezone with configurable buffer
4. ✅ Verification step executes after every cancellation
5. ✅ Failed verification triggers retry (max 3 attempts)
6. ✅ Failed verification after 3 attempts escalates to manual
7. ✅ manual_only cancellations notify 24h before danger date
8. ✅ danger_date_passed triggers immediate escalation
9. ✅ Confirmation emails detected and used for verification
10. ✅ Account status checked via API when available
11. ✅ Notification channels wired (email, Slack, Notion)
12. ✅ Cross-timezone billing scenarios tested
13. ✅ Sweep cadence configurable per service
14. ✅ Buffer period configurable per service

## Dependencies

- **KV ↔ Notion Sync:** Must be implemented first to track timezone data
- **Email Scanner:** Must be enhanced to detect confirmation emails
- **Notification System:** Must be wired (email/Slack/Notion)
- **Service API Integration:** Need status check endpoints for each service

## Risk Mitigation

**If implementation fails:**
- Use conservative 48-hour buffer for all services
- Default to manual escalation for all cancellations
- Send notifications for every cancellation attempt
- Require manual confirmation for high-value services

**Rollback Plan:**
- Revert to UTC-based danger dates if timezone logic fails
- Disable verification if it causes false positives
- Use fixed daily sweep if per-service cadence fails
- Manual review of all cancellations if automation fails

## Success Metrics

- **Zero charges due to timezone errors**
- **100% verification rate for API cancellations**
- **<5% manual escalation rate**
- **<1 hour notification lead time for manual actions**
- **99% sweep success rate within buffer period**

## Owner & Timeline

- **Owner:** Devin
- **Priority:** Tier 1 - Critical
- **Timeline:** Phase 1 (1-2 days), Phase 2 (3-5 days), Phase 3 (1-2 weeks)
- **Dependencies:** KV ↔ Notion Sync, Email Scanner, Notification System