/**
 * In-Memory Message Store
 * 
 * Messages are stored encrypted - the server never sees plaintext content.
 * For production, replace with a proper database.
 */

import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  encryptedContent: string; // E2E encrypted message
  timestamp: Date;
  isRead: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  messages: Message[];
  createdAt: Date;
}

// In-memory store
const chatRooms: Map<string, ChatRoom> = new Map();

/**
 * Generate a deterministic room ID for two users
 * This ensures both users get the same room regardless of who initiates
 */
export function getRoomId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `room_${sorted[0]}_${sorted[1]}`;
}

/**
 * Get or create a chat room between two users
 */
export function getOrCreateRoom(userId1: string, userId2: string): ChatRoom {
  const roomId = getRoomId(userId1, userId2);
  
  if (!chatRooms.has(roomId)) {
    chatRooms.set(roomId, {
      id: roomId,
      participants: [userId1, userId2],
      messages: [],
      createdAt: new Date(),
    });
  }
  
  return chatRooms.get(roomId)!;
}

/**
 * Add a message to a chat room
 */
export function addMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  receiverId: string,
  encryptedContent: string
): Message {
  const room = chatRooms.get(roomId);
  
  if (!room) {
    throw new Error('Chat room not found');
  }
  
  const message: Message = {
    id: uuidv4(),
    senderId,
    senderName,
    receiverId,
    encryptedContent,
    timestamp: new Date(),
    isRead: false,
  };
  
  room.messages.push(message);
  return message;
}

/**
 * Get messages from a chat room
 */
export function getMessages(roomId: string, limit: number = 50): Message[] {
  const room = chatRooms.get(roomId);
  
  if (!room) {
    return [];
  }
  
  // Return last 'limit' messages
  return room.messages.slice(-limit);
}

/**
 * Mark messages as read
 */
export function markMessagesAsRead(roomId: string, userId: string): void {
  const room = chatRooms.get(roomId);
  
  if (room) {
    room.messages.forEach((msg) => {
      if (msg.receiverId === userId && !msg.isRead) {
        msg.isRead = true;
      }
    });
  }
}

/**
 * Get unread message count for a user in a room
 */
export function getUnreadCount(roomId: string, userId: string): number {
  const room = chatRooms.get(roomId);
  
  if (!room) {
    return 0;
  }
  
  return room.messages.filter(
    (msg) => msg.receiverId === userId && !msg.isRead
  ).length;
}
