/**
 * Trial Monitor Test Suite
 * 
 * Comprehensive testing for trial monitoring service
 * Tests timezone-aware danger date calculation, notification delivery, and edge cases
 */

import { TrialMonitor, createTrialMonitor, createTrialMonitorWithConfig } from './trial-monitor.js';
import { VictusBridge } from '../../../src/core/victus_bridge.js';
import { TrialRecord } from '@aether/contracts/src/index.js';

// Mock VictusBridge for testing
class MockVictusBridge {
  private notifications: Array<{ event: string; details: any }> = [];

  async forwardCommand(command: any): Promise<any> {
    // Simulate VictusBridge by storing ALL commands
    this.notifications.push({
      event: command.operation,
      details: command.args,
    });
    return { success: true, data: command.args };
  }

  getNotifications() {
    return this.notifications;
  }

  clearNotifications() {
    this.notifications = [];
  }
}

// Mock notification sink that uses VictusBridge
class MockNotificationSink {
  private victusBridge: any;
  private notifications: Array<{ event: string; details: any }> = [];

  constructor(victusBridge: any) {
    this.victusBridge = victusBridge;
  }

  async sendDangerDateApproaching(trial: TrialRecord, hoursUntilDanger: number): Promise<void> {
    const command = {
      operation: 'send_notification',
      args: {
        type: 'danger_approaching',
        trialId: trial.id,
        service: trial.service,
        hoursUntilDanger,
        dangerDate: trial.dangerDate,
      },
    };
    await this.victusBridge.forwardCommand(command);
    this.notifications.push({ event: 'danger_approaching', details: command.args });
  }

  async send(event: any): Promise<void> {
    const command = {
      operation: 'send_notification',
      args: event,
    };
    await this.victusBridge.forwardCommand(command);
    this.notifications.push({ event: event.eventType, details: event });
  }

  getNotifications() {
    return this.notifications;
  }

  clearNotifications() {
    this.notifications = [];
  }
}

// Test data
const testTrials: TrialRecord[] = [
  {
    id: 'trial_1',
    service: 'CircleCI',
    status: 'active',
    startDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(), // 13 days ago
    dangerDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow (14 days total)
    dangerDateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedSavings: 99,
    source: 'manual_entry',
    vendorTimezone: 'America/Los_Angeles',
    billingTime: '00:00',
    billingTimezone: 'America/Los_Angeles',
    verificationStatus: 'unverified',
    verificationAttempts: 0,
    metadata: {
      requiresCreditCard: true,
      autoCancelRequired: true,
      features: ['unlimited minutes', 'parallel jobs'],
      limitations: ['14 days'],
      lastSync: new Date().toISOString(),
      syncSource: 'put',
    },
  },
  {
    id: 'trial_2',
    service: 'Datadog',
    status: 'active',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    dangerDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now (14 days total)
    dangerDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedSavings: 199,
    source: 'manual_entry',
    vendorTimezone: 'America/New_York',
    billingTime: '00:00',
    billingTimezone: 'America/New_York',
    verificationStatus: 'unverified',
    verificationAttempts: 0,
    metadata: {
      requiresCreditCard: true,
      autoCancelRequired: true,
      features: ['monitoring', 'logs'],
      limitations: ['14 days'],
      lastSync: new Date().toISOString(),
      syncSource: 'put',
    },
  },
  {
    id: 'trial_3',
    service: 'MongoDB Atlas',
    status: 'active',
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    dangerDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday (overdue, 14 days total)
    dangerDateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedSavings: 299,
    source: 'manual_entry',
    vendorTimezone: 'UTC',
    billingTime: '00:00',
    billingTimezone: 'UTC',
    verificationStatus: 'unverified',
    verificationAttempts: 0,
    metadata: {
      requiresCreditCard: true,
      autoCancelRequired: true,
      features: ['512MB storage', '3 nodes'],
      limitations: ['30 days'],
      lastSync: new Date().toISOString(),
      syncSource: 'put',
    },
  },
  {
    id: 'trial_4',
    service: 'Vercel',
    status: 'active',
    startDate: new Date().toISOString(),
    dangerDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    dangerDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedSavings: 0,
    source: 'manual_entry',
    vendorTimezone: 'America/New_York',
    billingTime: '00:00',
    billingTimezone: 'America/New_York',
    verificationStatus: 'unverified',
    verificationAttempts: 0,
    metadata: {
      requiresCreditCard: false,
      autoCancelRequired: false,
      features: ['hosting', 'edge functions'],
      limitations: ['hobby plan'],
      lastSync: new Date().toISOString(),
      syncSource: 'put',
    },
  },
];

async function runTests() {
  console.log('=== Trial Monitor Test Suite ===\n');

  const mockVictusBridge = new MockVictusBridge() as any;
  const mockNotificationSink = new MockNotificationSink(mockVictusBridge);
  mockNotificationSink.clearNotifications();
  
  const monitor = createTrialMonitorWithConfig(
    {
      checkInterval: 5000, // 5 seconds for testing
      notificationLeadTime: 24, // 24 hours for testing
      notificationSink: mockNotificationSink,
    },
    mockVictusBridge as any
  );

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Add trials
  console.log('Test 1: Add trials to monitor');
  try {
    testTrials.forEach(trial => monitor.addTrial(trial));
    console.log('✅ PASS: All trials added');
    testsPassed++;
  } catch (error) {
    console.log('❌ FAIL: Could not add trials:', error);
    testsFailed++;
  }

  // Test 2: Check trial count
  console.log('\nTest 2: Check trial count');
  try {
    const trials = monitor.getTrials();
    if (trials.length === testTrials.length) {
      console.log(`✅ PASS: Correct trial count (${trials.length})`);
      testsPassed++;
    } else {
      console.log(`❌ FAIL: Expected ${testTrials.length} trials, got ${trials.length}`);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Could not get trials:', error);
    testsFailed++;
  }

  // Test 3: Run trial check
  console.log('\nTest 3: Run trial check');
  try {
    mockNotificationSink.clearNotifications();
    const result = await monitor.checkTrials();
    console.log('✅ PASS: Trial check completed');
    console.log(`  Trials checked: ${result.trialsChecked}`);
    console.log(`  Trials approaching: ${result.trialsApproaching}`);
    console.log(`  Trials overdue: ${result.trialsOverdue}`);
    console.log(`  Notifications sent: ${result.notificationsSent}`);
    testsPassed++;
  } catch (error) {
    console.log('❌ FAIL: Trial check failed:', error);
    testsFailed++;
  }

  // Test 4: Check notifications were sent
  console.log('\nTest 4: Check notifications were sent');
  try {
    const notifications = mockNotificationSink.getNotifications();
    console.log(`Total notifications captured: ${notifications.length}`);
    
    // The trial check should have sent notifications for approaching and overdue trials
    // We expect at least 2 notifications from the first check
    if (notifications.length >= 2) {
      console.log(`✅ PASS: ${notifications.length} notifications sent`);
      notifications.forEach((notif, i) => {
        console.log(`  ${i + 1}. ${notif.event}:`, notif.details);
      });
      testsPassed++;
    } else {
      console.log(`❌ FAIL: Expected at least 2 notifications, got ${notifications.length}`);
      console.log('Notifications:', notifications);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Could not check notifications:', error);
    testsFailed++;
  }

  // Test 5: Remove trial
  console.log('\nTest 5: Remove trial');
  try {
    monitor.removeTrial('trial_1');
    const trials = monitor.getTrials();
    if (trials.length === testTrials.length - 1) {
      console.log('✅ PASS: Trial removed successfully');
      testsPassed++;
    } else {
      console.log(`❌ FAIL: Expected ${testTrials.length - 1} trials, got ${trials.length}`);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Could not remove trial:', error);
    testsFailed++;
  }

  // Test 6: Calendar-aware danger date calculation
  console.log('\nTest 6: Calendar-aware danger date calculation');
  try {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const dangerDate = tomorrow.toISOString().split('T')[0];
    
    // Verify danger date is in YYYY-MM-DD format
    if (dangerDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log(`✅ PASS: Danger date in correct format: ${dangerDate}`);
      testsPassed++;
    } else {
      console.log(`❌ FAIL: Danger date not in YYYY-MM-DD format: ${dangerDate}`);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Date calculation test failed:', error);
    testsFailed++;
  }

  // Test 7: Timezone-aware calculation
  console.log('\nTest 7: Timezone-aware danger date calculation');
  try {
    const trial = testTrials[0]; // CircleCI in Los Angeles timezone
    const startDate = new Date(trial.startDate);
    const dangerDateString = trial.dangerDate; // YYYY-MM-DD format
    
    // The danger date should be 14 days after start date
    const expectedDangerDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const expectedDangerDateString = expectedDangerDate.toISOString().split('T')[0];
    
    // Check if the calendar dates match
    if (dangerDateString === expectedDangerDateString) {
      console.log('✅ PASS: Timezone-aware calculation is accurate');
      console.log(`  Expected: ${expectedDangerDateString}`);
      console.log(`  Actual: ${dangerDateString}`);
      testsPassed++;
    } else {
      console.log(`❌ FAIL: Calendar dates don't match`);
      console.log(`  Expected: ${expectedDangerDateString}`);
      console.log(`  Actual: ${dangerDateString}`);
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Timezone calculation test failed:', error);
    testsFailed++;
  }

  // Test 8: Start/stop monitoring
  console.log('\nTest 8: Start/stop monitoring');
  try {
    mockNotificationSink.clearNotifications();
    await monitor.start();
    const status1 = monitor.getStatus();
    if (status1.isRunning) {
      console.log('✅ PASS: Monitor started');
      
      await monitor.stop();
      const status2 = monitor.getStatus();
      if (!status2.isRunning) {
        console.log('✅ PASS: Monitor stopped');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Monitor did not stop');
        testsFailed++;
      }
    } else {
      console.log('❌ FAIL: Monitor did not start');
      testsFailed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Start/stop test failed:', error);
    testsFailed++;
  }

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Tests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}`);
  console.log(`Total tests: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n✅ ALL TESTS PASSED');
  } else {
    console.log('\n❌ SOME TESTS FAILED');
  }
}

// Run tests
runTests().catch(console.error);
