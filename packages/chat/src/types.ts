/**
 * @aether/chat - Real-time chat system types
 * 
 * TypeScript types for chat functionality including WebSocket, rooms,
 * typing indicators, read receipts, and message history.
 * 
 * @version 1.0.0
 */

// =============================================================================
// USER TYPES
// =============================================================================

export interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline' | 'busy';
  lastSeen?: Date;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// MESSAGE TYPES
// =============================================================================

export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'system' | 'emoji';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  type: MessageType;
  content: string;
  replyTo?: string;
  mentions?: string[];
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
  count: number;
}

// =============================================================================
// ROOM TYPES
// =============================================================================

export type RoomType = 'direct' | 'group' | 'channel' | 'thread';

export type RoomVisibility = 'public' | 'private' | 'hidden';

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: RoomType;
  visibility: RoomVisibility;
  ownerId: string;
  memberIds: string[];
  adminIds: string[];
  avatar?: string;
  topic?: string;
  pinnedMessageIds?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface RoomMember {
  roomId: string;
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  lastReadAt?: Date;
  mutedUntil?: Date;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// TYPING INDICATOR TYPES
// =============================================================================

export interface TypingIndicator {
  roomId: string;
  userId: string;
  timestamp: Date;
}

export interface TypingStatus {
  roomId: string;
  typingUsers: Map<string, Date>;
}

// =============================================================================
// READ RECEIPT TYPES
// =============================================================================

export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: Date;
}

export interface MessageReadStatus {
  messageId: string;
  readBy: string[];
  readCount: number;
  unreadCount: number;
}

// =============================================================================
// MESSAGE HISTORY TYPES
// =============================================================================

export interface MessageHistoryOptions {
  roomId: string;
  limit?: number;
  before?: string;
  after?: string;
  includeDeleted?: boolean;
  includeEdited?: boolean;
}

export interface MessageHistoryResult {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
  previousCursor?: string;
}

// =============================================================================
// WEBSOCKET TYPES
// =============================================================================

export type WebSocketEventType =
  | 'message'
  | 'message_updated'
  | 'message_deleted'
  | 'typing_start'
  | 'typing_stop'
  | 'read_receipt'
  | 'user_joined'
  | 'user_left'
  | 'user_status_changed'
  | 'room_created'
  | 'room_updated'
  | 'room_deleted'
  | 'reaction_added'
  | 'reaction_removed';

export interface WebSocketEvent {
  type: WebSocketEventType;
  roomId: string;
  userId?: string;
  data: unknown;
  timestamp: Date;
}

export interface WebSocketMessage {
  event: WebSocketEventType;
  payload: unknown;
  roomId?: string;
  userId?: string;
}

// =============================================================================
// CHAT ERROR TYPES
// =============================================================================

export class ChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

export class RoomNotFoundError extends ChatError {
  constructor(roomId: string) {
    super(`Room not found: ${roomId}`, 'ROOM_NOT_FOUND');
    this.name = 'RoomNotFoundError';
  }
}

export class UserNotFoundError extends ChatError {
  constructor(userId: string) {
    super(`User not found: ${userId}`, 'USER_NOT_FOUND');
    this.name = 'UserNotFoundError';
  }
}

export class MessageNotFoundError extends ChatError {
  constructor(messageId: string) {
    super(`Message not found: ${messageId}`, 'MESSAGE_NOT_FOUND');
    this.name = 'MessageNotFoundError';
  }
}

export class PermissionDeniedError extends ChatError {
  constructor(action: string) {
    super(`Permission denied: ${action}`, 'PERMISSION_DENIED');
    this.name = 'PermissionDeniedError';
  }
}

export class RoomFullError extends ChatError {
  constructor(roomId: string, maxMembers: number) {
    super(`Room is full: ${roomId} (max ${maxMembers} members)`, 'ROOM_FULL');
    this.name = 'RoomFullError';
  }
}
