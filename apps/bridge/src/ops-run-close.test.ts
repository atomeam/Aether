/**
 * Tests for /ops/run-close endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handlePostRunClose, parseResultLine, parseTaskId } from './ops-run-close';

describe('POST /ops/run-close', () => {
  const mockEnv = {
    NOTION_TOKEN: 'test-notion-token',
    SLACK_SIGNING_SECRET: 'test-slack-secret',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles Slack URL verification challenge', async () => {
    const request = new Request('https://example.com/ops/run-close', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        challenge: 'test-challenge',
      }),
    });

    const response = await handlePostRunClose(request, mockEnv as any);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.challenge).toBe('test-challenge');
  });

  it('rejects without Slack signature', async () => {
    const request = new Request('https://example.com/ops/run-close', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: {
          type: 'message',
          text: 'TEST: message',
        },
      }),
    });

    const response = await handlePostRunClose(request, mockEnv as any);
    expect(response.status).toBe(401);
  });

  it('parses RESULT: line correctly', () => {
    const text = 'RESULT (abc123): smoke test passed';
    const result = parseResultLine(text);
    
    expect(result).toEqual({
      run_id: 'abc123',
      result: 'smoke test passed',
    });
  });

  it('returns null for invalid RESULT: line', () => {
    const text = 'INVALID: no result here';
    const result = parseResultLine(text);
    
    expect(result).toBeNull();
  });

  it('parses task_id from RUN header', () => {
    const text = 'TASK: https://www.notion.so/test-page-1234567890abcdef';
    const taskId = parseTaskId(text);
    
    expect(taskId).toBe('https://www.notion.so/test-page-1234567890abcdef');
  });

  it('returns null for invalid TASK: line', () => {
    const text = 'INVALID: no task here';
    const taskId = parseTaskId(text);
    
    expect(taskId).toBeNull();
  });

  it('skips non-message events', async () => {
    const request = new Request('https://example.com/ops/run-close', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-slack-request-timestamp': Math.floor(Date.now() / 1000).toString(),
        'x-slack-signature': 'v0=mock-signature',
      },
      body: JSON.stringify({
        event: {
          type: 'reaction_added',
          text: 'TEST: reaction',
        },
      }),
    });

    const response = await handlePostRunClose(request, mockEnv as any);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.message).toBe('Event type not processed');
  });
});
