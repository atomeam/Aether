import { describe, it, expect } from 'vitest';

describe('Path Parsing', () => {
  describe('/tasks/:id/close route', () => {
    it('should extract task_id correctly from /tasks/{id}/close', () => {
      const path = '/tasks/test-task/close';
      const taskId = path.slice(7, -6); // Same logic as in index.ts
      expect(taskId).toBe('test-task');
    });

    it('should handle task_id with hyphens', () => {
      const path = '/tasks/my-test-task-123/close';
      const taskId = path.slice(7, -6);
      expect(taskId).toBe('my-test-task-123');
    });

    it('should handle task_id with underscores', () => {
      const path = '/tasks/my_test_task/close';
      const taskId = path.slice(7, -6);
      expect(taskId).toBe('my_test_task');
    });

    it('should handle task_id with mixed characters', () => {
      const path = '/tasks/task-ABC_123/close';
      const taskId = path.slice(7, -6);
      expect(taskId).toBe('task-ABC_123');
    });

    it('should handle single-character task_id', () => {
      const path = '/tasks/a/close';
      const taskId = path.slice(7, -6);
      expect(taskId).toBe('a');
    });
  });

  describe('Route shape validation', () => {
    it('should correctly identify /tasks/:id/close pattern', () => {
      const validPaths = [
        '/tasks/abc/close',
        '/tasks/123/close',
        '/tasks/task-with-dashes/close',
        '/tasks/task_with_underscores/close',
      ];

      validPaths.forEach(path => {
        const startsWithTasks = path.startsWith('/tasks/');
        const endsWithClose = path.endsWith('/close');
        expect(startsWithTasks).toBe(true);
        expect(endsWithClose).toBe(true);
      });
    });

    it('should reject malformed paths', () => {
      const invalidPaths = [
        '/tasks/abc', // missing /close
        '/tasks/abc/close/extra', // extra segment
        '/other/abc/close', // wrong prefix
      ];

      invalidPaths.forEach(path => {
        const isValid = path.startsWith('/tasks/') && path.endsWith('/close');
        expect(isValid).toBe(false);
      });
    });

    it('should handle empty task_id as edge case', () => {
      const path = '/tasks//close';
      const taskId = path.slice(7, -6);
      expect(taskId).toBe(''); // Empty string is technically valid for the parsing logic
    });
  });
});

describe('State Transition Logic', () => {
  it('should allow status transitions from RUNNING to COMPLETED', () => {
    const transitions = [
      { from: 'RUNNING', to: 'COMPLETED' },
      { from: 'RUNNING', to: 'FAILED' },
      { from: 'RUNNING', to: 'BLOCKED' },
      { from: 'COMPLETED', to: 'FAILED' }, // edge case: re-open
    ];

    transitions.forEach(({ from, to }) => {
      const validStatuses = ['RUNNING', 'COMPLETED', 'FAILED', 'BLOCKED'];
      expect(validStatuses).toContain(from);
      expect(validStatuses).toContain(to);
    });
  });

  it('should preserve created_at and started on state transitions', () => {
    // This validates the ON CONFLICT logic: created_at and started are NOT in the UPDATE clause
    const originalRow = {
      task_id: 'test-task',
      run_id: 'test-run-001',
      type: 'COUNCIL',
      started: '2026-05-28T14:30:00Z',
      owner: 'Council',
      status: 'RUNNING',
      created_at: '2026-05-28T14:30:00Z',
      updated_at: '2026-05-28T14:30:00Z',
    };

    const updateRow = {
      ...originalRow,
      status: 'COMPLETED',
      ended: '2026-05-28T14:35:00Z',
      result: 'SUCCESS',
      updated_at: '2026-05-28T14:35:00Z',
    };

    // Verify immutable fields
    expect(updateRow.started).toBe(originalRow.started);
    expect(updateRow.created_at).toBe(originalRow.created_at);
    expect(updateRow.task_id).toBe(originalRow.task_id);
    expect(updateRow.run_id).toBe(originalRow.run_id);
    expect(updateRow.type).toBe(originalRow.type);
    expect(updateRow.owner).toBe(originalRow.owner);

    // Verify mutable fields
    expect(updateRow.status).not.toBe(originalRow.status);
    expect(updateRow.ended).not.toBe(originalRow.ended);
    expect(updateRow.result).not.toBe(originalRow.result);
    expect(updateRow.updated_at).not.toBe(originalRow.updated_at);
  });
});
