'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import { Shield, MessageSquare } from 'lucide-react';
import { connectSocket, disconnectSocket } from '@/lib/socket-client';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function ChatLayout() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (session?.user?.id) {
      connectSocket(session.user.id);
    }

    return () => {
      disconnectSocket();
    };
  }, [session?.user?.id]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || !session?.user) {
    return (
      <div className="min-h-screen bg-dark-300 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading secure chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-300 flex">
      <UserList
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        }}
        onSelectUser={setSelectedUser}
        selectedUserId={selectedUser?.id}
      />

      {selectedUser ? (
        <ChatWindow
          currentUser={{
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
          }}
          selectedUser={selectedUser}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-dark-200">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-12 h-12 text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome to SecureChat
            </h2>
            <p className="text-gray-400 mb-6">
              Select a user from the list to start a secure, end-to-end encrypted
              conversation.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-dark-100 rounded-lg">
                <Shield className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                <p className="text-white font-medium">E2E Encrypted</p>
                <p className="text-gray-500 text-xs">AES-256-GCM</p>
              </div>
              <div className="p-4 bg-dark-100 rounded-lg">
                <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-white font-medium">Secure Keys</p>
                <p className="text-gray-500 text-xs">PBKDF2 Derived</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
