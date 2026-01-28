'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(userId: string): Socket {
  const s = getSocket();
  
  if (!s.connected) {
    s.connect();
    s.emit('join', userId);
  }
  
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinRoom(roomId: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('join-room', roomId);
  }
}

export function leaveRoom(roomId: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('leave-room', roomId);
  }
}

export function sendMessage(roomId: string, message: any): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('send-message', { roomId, message });
  }
}

export function emitTyping(roomId: string, userId: string, userName: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('typing', { roomId, userId, userName });
  }
}

export function emitStopTyping(roomId: string, userId: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('stop-typing', { roomId, userId });
  }
}
