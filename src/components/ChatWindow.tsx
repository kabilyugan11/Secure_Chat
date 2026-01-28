'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Lock, AlertCircle } from 'lucide-react';
import { encryptForRoom, decryptFromRoom } from '@/lib/crypto';
import { 
  getSocket, 
  joinRoom, 
  leaveRoom, 
  sendMessage as socketSendMessage,
  emitTyping,
  emitStopTyping
} from '@/lib/socket-client';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  encryptedContent: string;
  decryptedContent?: string;
  timestamp: Date;
  isRead: boolean;
  decryptionFailed?: boolean;
}

interface ChatUser {
  id: string;
  name: string;
  email: string;
}

interface ChatWindowProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  selectedUser: ChatUser;
}

export default function ChatWindow({
  currentUser,
  selectedUser,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate room ID for two users
  const getRoomId = useCallback(() => {
    return [currentUser.id, selectedUser.id].sort().join('_');
  }, [currentUser.id, selectedUser.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Decrypt a single message
  const decryptMessage = useCallback(async (msg: Message): Promise<Message> => {
    if (msg.decryptedContent) return msg;

    try {
      const otherUserId = msg.senderId === currentUser.id 
        ? msg.receiverId 
        : msg.senderId;
      
      const decryptedContent = await decryptFromRoom(
        msg.encryptedContent,
        currentUser.id,
        otherUserId
      );
      return { ...msg, decryptedContent };
    } catch (err) {
      console.error('Failed to decrypt message:', err);
      return { ...msg, decryptionFailed: true };
    }
  }, [currentUser.id]);

  // Decrypt messages
  const decryptMessages = useCallback(async (msgs: Message[]) => {
    const decrypted = await Promise.all(msgs.map(decryptMessage));
    return decrypted;
  }, [decryptMessage]);

  // Fetch messages when user is selected
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/messages?otherUserId=${selectedUser.id}`
        );
        const data = await response.json();

        if (data.messages) {
          const decrypted = await decryptMessages(data.messages);
          setMessages(decrypted);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };

    fetchMessages();
  }, [selectedUser.id, decryptMessages]);

  // Socket.io real-time messaging
  useEffect(() => {
    const socket = getSocket();
    const roomId = getRoomId();

    // Join the chat room
    joinRoom(roomId);

    // Listen for new messages
    const handleNewMessage = async (message: Message) => {
      // Don't add duplicate messages
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        
        // Decrypt and add the message
        decryptMessage(message).then((decrypted) => {
          setMessages((current) => {
            const stillExists = current.some((m) => m.id === decrypted.id);
            if (stillExists) return current;
            return [...current, decrypted];
          });
        });
        
        return prev;
      });
    };

    // Listen for typing indicators
    const handleUserTyping = (data: { userId: string; userName: string }) => {
      if (data.userId === selectedUser.id) {
        setTypingUser(data.userName);
      }
    };

    const handleUserStopTyping = (data: { userId: string }) => {
      if (data.userId === selectedUser.id) {
        setTypingUser(null);
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);

    return () => {
      leaveRoom(roomId);
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
    };
  }, [currentUser.id, selectedUser.id, getRoomId, decryptMessage]);

  // Handle typing indicator
  const handleTyping = () => {
    const roomId = getRoomId();
    
    if (!isTyping) {
      setIsTyping(true);
      emitTyping(roomId, currentUser.id, currentUser.name);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emitStopTyping(roomId, currentUser.id);
    }, 2000);
  };

  // Send encrypted message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setIsLoading(true);
    setError(null);

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    emitStopTyping(getRoomId(), currentUser.id);

    try {
      // Encrypt the message
      const encryptedContent = await encryptForRoom(
        newMessage,
        currentUser.id,
        selectedUser.id
      );

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          encryptedContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Create the message with decrypted content
      const messageWithContent = {
        ...data.message,
        decryptedContent: newMessage,
      };

      // Add to local state
      setMessages((prev) => [...prev, messageWithContent]);

      // Emit via Socket.io for real-time delivery
      socketSendMessage(getRoomId(), messageWithContent);

      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col bg-dark-200">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-700 bg-dark-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {selectedUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-white font-medium">{selectedUser.name}</h3>
              <p className="text-xs text-gray-400">
                {typingUser ? (
                  <span className="text-green-400">typing...</span>
                ) : (
                  selectedUser.email
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <Lock className="w-4 h-4" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Lock className="w-12 h-12 mb-3 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Send a secure message to start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] ${
                    isOwn
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-100 text-gray-200'
                  } rounded-2xl px-4 py-2 shadow-lg`}
                >
                  {msg.decryptionFailed ? (
                    <div className="flex items-center gap-2 text-red-300">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Unable to decrypt message</span>
                    </div>
                  ) : (
                    <p className="break-words">
                      {msg.decryptedContent || msg.encryptedContent}
                    </p>
                  )}
                  <div
                    className={`text-xs mt-1 flex items-center gap-1 ${
                      isOwn ? 'text-primary-200' : 'text-gray-500'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUser && (
        <div className="px-4 py-2 text-gray-400 text-sm flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>{typingUser} is typing...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a secure message..."
            className="flex-1 bg-dark-100 text-white placeholder-gray-500 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white p-3 rounded-full transition-colors"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
