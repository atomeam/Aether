export type FeedSource = 'live' | 'stub';

export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  updatedAt?: string;
}

export interface AuditEventSummary {
  id: string;
  type: string;
  actor?: string;
  createdAt?: string;
}

export interface FeedResult<T> {
  source: FeedSource;
  endpoint: string;
  items: T[];
  error?: string;
}
