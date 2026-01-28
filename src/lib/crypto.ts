// Simple encryption using shared room keys
// Both users in a chat derive the same key from the room ID

// Generate a deterministic room ID for two users
export function getRoomId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `room_${sorted[0]}_${sorted[1]}`;
}

// Convert string to ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer as ArrayBuffer;
}

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

// Derive an encryption key from the room ID
async function deriveKeyFromRoom(roomId: string): Promise<CryptoKey> {
  const keyData = stringToArrayBuffer(roomId);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    keyData,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Use a fixed salt for deterministic key derivation
  const salt = stringToArrayBuffer('secure-chat-salt-v1');

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a message for a specific chat room
export async function encryptForRoom(
  message: string,
  myUserId: string,
  otherUserId: string
): Promise<string> {
  const roomId = getRoomId(myUserId, otherUserId);
  const key = await deriveKeyFromRoom(roomId);
  
  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the message
  const messageBuffer = stringToArrayBuffer(message);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    messageBuffer
  );

  // Combine IV and encrypted data
  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);

  return arrayBufferToBase64(combined.buffer as ArrayBuffer);
}

// Decrypt a message from a specific chat room
export async function decryptFromRoom(
  encryptedData: string,
  myUserId: string,
  otherUserId: string
): Promise<string> {
  const roomId = getRoomId(myUserId, otherUserId);
  const key = await deriveKeyFromRoom(roomId);

  // Decode base64
  const combinedBuffer = base64ToArrayBuffer(encryptedData);
  const combined = new Uint8Array(combinedBuffer);
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  // Decrypt the message
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

// Simple CryptoManager class for the chat components
export class CryptoManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async encryptFor(message: string, recipientId: string): Promise<string> {
    return encryptForRoom(message, this.userId, recipientId);
  }

  async decryptFrom(encryptedMessage: string, senderId: string): Promise<string> {
    return decryptFromRoom(encryptedMessage, this.userId, senderId);
  }
}

// Singleton instance
let cryptoManagerInstance: CryptoManager | null = null;

export function initializeCrypto(userId: string): CryptoManager {
  cryptoManagerInstance = new CryptoManager(userId);
  return cryptoManagerInstance;
}

export function getCryptoManager(): CryptoManager | null {
  return cryptoManagerInstance;
}
