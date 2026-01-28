'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Users, Shield, LogOut, X } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface User {
  id: string;
  name: string;
  email: string;
  publicKey?: string;
}

interface UserListProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  onSelectUser: (user: User) => void;
  selectedUserId?: string;
}

// Helper function to highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <span key={index} className="bg-primary-500/30 text-primary-300 rounded px-0.5">
        {part}
      </span>
    ) : (
      part
    )
  );
}

export default function UserList({
  currentUser,
  onSelectUser,
  selectedUserId,
}: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        if (data.users) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Memoized filtered users for performance
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return users;
    
    return users.filter((user) => {
      const nameMatch = user.name.toLowerCase().includes(query);
      const emailMatch = user.email.toLowerCase().includes(query);
      return nameMatch || emailMatch;
    });
  }, [users, searchQuery]);

  const clearSearch = () => setSearchQuery('');

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="w-80 bg-dark-100 border-r border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-400" />
            <h1 className="text-xl font-bold text-white">SecureChat</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-200 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Info */}
        <div className="flex items-center gap-3 p-3 bg-dark-200 rounded-lg">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {currentUser.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
          </div>
          <div className="w-3 h-3 bg-green-500 rounded-full" title="Online" />
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-dark-200 text-white placeholder-gray-500 rounded-lg pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-500 mt-2">
            Found {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} matching "{searchQuery}"
          </p>
        )}
      </div>

      {/* Users Label */}
      <div className="px-4 py-2 flex items-center gap-2 text-gray-400 text-sm">
        <Users className="w-4 h-4" />
        <span>{searchQuery ? 'Search Results' : 'Available Users'}</span>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No users found</p>
            {searchQuery && (
              <p className="text-xs mt-1">Try searching with a different name or email</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  selectedUserId === user.id
                    ? 'bg-primary-600/20 border border-primary-600/50'
                    : 'hover:bg-dark-200'
                }`}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white font-medium truncate">
                    {highlightMatch(user.name, searchQuery)}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {highlightMatch(user.email, searchQuery)}
                  </p>
                </div>
                {user.publicKey && (
                  <span title="Has encryption key">
                    <Shield
                      className="w-4 h-4 text-green-400 flex-shrink-0"
                    />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Shield className="w-4 h-4" />
          <span>End-to-end encrypted • AES-256-GCM</span>
        </div>
      </div>
    </div>
  );
}
