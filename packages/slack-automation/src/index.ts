/**
 * Slack Automation Package
 * 
 * Send messages, create channels, manage users, and automate notifications.
 */

import { z } from 'zod';

// Input schemas
export const SendMessageSchema = z.object({
  channel: z.string(),
  text: z.string(),
  blocks: z.array(z.any()).optional(),
  threadTs: z.string().optional(),
});

export const CreateChannelSchema = z.object({
  name: z.string(),
  isPrivate: z.boolean().default(false),
});

export const AddReactionSchema = z.object({
  channel: z.string(),
  timestamp: z.string(),
  reaction: z.string(),
});

export const ScheduleMessageSchema = z.object({
  channel: z.string(),
  text: z.string(),
  postAt: z.number(), // Unix timestamp
});

// Slack API helpers using raw fetch
const SLACK_API = 'https://slack.com/api';

async function slackFetch(method: string, data: Record<string, any>) {
  const token = process.env.SLACK_TOKEN;
  
  if (!token) {
    throw new Error('SLACK_TOKEN environment variable is required');
  }
  
  const response = await fetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  
  if (!result.ok) {
    throw new Error(`Slack API error: ${result.error}`);
  }
  
  return result;
}

// Send a message to a channel
export async function sendMessage(input: z.infer<typeof SendMessageSchema>) {
  const { channel, text, blocks, threadTs } = SendMessageSchema.parse(input);
  
  return slackFetch('chat.postMessage', {
    channel,
    text,
    blocks,
    thread_ts: threadTs,
  });
}

// Create a channel
export async function createChannel(input: z.infer<typeof CreateChannelSchema>) {
  const { name, isPrivate } = CreateChannelSchema.parse(input);
  
  return slackFetch('conversations.create', {
    name,
    is_private: isPrivate,
  });
}

// Add a reaction to a message
export async function addReaction(input: z.infer<typeof AddReactionSchema>) {
  const { channel, timestamp, reaction } = AddReactionSchema.parse(input);
  
  return slackFetch('reactions.add', {
    channel,
    timestamp,
    name: reaction,
  });
}

// Schedule a message
export async function scheduleMessage(input: z.infer<typeof ScheduleMessageSchema>) {
  const { channel, text, postAt } = ScheduleMessageSchema.parse(input);
  
  return slackFetch('chat.scheduleMessage', {
    channel,
    text,
    post_at: postAt,
  });
}

// Get channel info
export async function getChannelInfo(channel: string) {
  return slackFetch('conversations.info', { channel });
}

// List channels
export async function listChannels() {
  return slackFetch('conversations.list', {
    types: 'public_channel,private_channel',
  });
}

// Get user info
export async function getUserInfo(user: string) {
  return slackFetch('users.info', { user });
}

// Export schemas for validation
export const schemas = {
  sendMessage: SendMessageSchema,
  createChannel: CreateChannelSchema,
  addReaction: AddReactionSchema,
  scheduleMessage: ScheduleMessageSchema,
};
