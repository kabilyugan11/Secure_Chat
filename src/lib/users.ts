/**
 * User Store with JSON File Database
 * 
 * All user data is stored in a JSON file.
 * Passwords are hashed using bcrypt before storage.
 */

import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { 
  getUsers, 
  findUserByEmail, 
  findUserById, 
  addUser, 
  updateUser,
  deleteUser as dbDeleteUser,
  type UserRecord 
} from './database';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
  publicKey?: string;
  createdAt: Date;
}

// Flag to track if demo users have been initialized
let demoUsersInitialized = false;

/**
 * Convert UserRecord to StoredUser
 */
function recordToUser(record: UserRecord): StoredUser {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    password: record.password,
    publicKey: record.publicKey,
    createdAt: new Date(record.createdAt),
  };
}

/**
 * Initialize demo users if they don't exist
 */
async function initializeDemoUsers(): Promise<void> {
  if (demoUsersInitialized) return;

  const demoUsers = [
    { email: 'alice@example.com', name: 'Alice', password: 'password123' },
    { email: 'bob@example.com', name: 'Bob', password: 'password123' },
    { email: 'charlie@example.com', name: 'Charlie', password: 'password123' },
  ];

  for (const user of demoUsers) {
    const existing = findUserByEmail(user.email);
    if (!existing) {
      const hashedPassword = await hash(user.password, 12);
      addUser({
        id: uuidv4(),
        email: user.email,
        name: user.name,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      });
    }
  }

  demoUsersInitialized = true;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  await initializeDemoUsers();
  
  const record = findUserByEmail(email);
  return record ? recordToUser(record) : null;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<StoredUser | null> {
  await initializeDemoUsers();
  
  const record = findUserById(id);
  return record ? recordToUser(record) : null;
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  name: string,
  password: string
): Promise<StoredUser> {
  await initializeDemoUsers();

  // Check if user exists
  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await hash(password, 12);
  const id = uuidv4();
  const createdAt = new Date();

  const record: UserRecord = {
    id,
    email,
    name,
    password: hashedPassword,
    createdAt: createdAt.toISOString(),
  };

  addUser(record);

  return {
    id,
    email,
    name,
    password: hashedPassword,
    createdAt,
  };
}

/**
 * Update user's public key
 */
export async function updateUserPublicKey(
  userId: string,
  publicKey: string
): Promise<StoredUser | null> {
  await initializeDemoUsers();

  const updated = updateUser(userId, { publicKey });
  return updated ? recordToUser(updated) : null;
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<Omit<StoredUser, 'password'>[]> {
  await initializeDemoUsers();

  return getUsers().map(record => ({
    id: record.id,
    email: record.email,
    name: record.name,
    publicKey: record.publicKey,
    createdAt: new Date(record.createdAt),
  }));
}

/**
 * Get all users except the specified one
 */
export async function getUsersExcept(
  excludeId: string
): Promise<Omit<StoredUser, 'password'>[]> {
  await initializeDemoUsers();

  return getUsers()
    .filter(record => record.id !== excludeId)
    .map(record => ({
      id: record.id,
      email: record.email,
      name: record.name,
      publicKey: record.publicKey,
      createdAt: new Date(record.createdAt),
    }));
}

/**
 * Delete a user
 */
export async function deleteUserById(userId: string): Promise<boolean> {
  return dbDeleteUser(userId);
}

/**
 * Update user's password
 */
export async function updateUserPassword(
  userId: string,
  newPassword: string
): Promise<boolean> {
  const hashedPassword = await hash(newPassword, 12);
  const updated = updateUser(userId, { password: hashedPassword });
  return !!updated;
}
