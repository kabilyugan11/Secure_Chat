/**
 * JSON File-Based Database
 * 
 * Simple file-based persistence for development.
 * Data is stored in a JSON file.
 * 
 * For production, consider using:
 * - Turso (SQLite edge database)
 * - PlanetScale
 * - Supabase
 * - MongoDB Atlas
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  password: string;
  publicKey?: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
}

const DB_PATH = join(process.cwd(), 'data', 'database.json');

/**
 * Initialize the database
 */
function initDatabase(): DatabaseSchema {
  // Ensure data directory exists
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  // Load existing database or create new one
  if (existsSync(DB_PATH)) {
    try {
      const data = readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      return { users: [] };
    }
  }

  const initialData: DatabaseSchema = { users: [] };
  writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
  return initialData;
}

/**
 * Save database to file
 */
export function saveDatabase(data: DatabaseSchema): void {
  // Ensure data directory exists
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

/**
 * Get the database
 */
export function getDatabase(): DatabaseSchema {
  return initDatabase();
}

/**
 * Get all users
 */
export function getUsers(): UserRecord[] {
  const db = getDatabase();
  return db.users;
}

/**
 * Find user by email
 */
export function findUserByEmail(email: string): UserRecord | undefined {
  const db = getDatabase();
  return db.users.find(u => u.email === email);
}

/**
 * Find user by ID
 */
export function findUserById(id: string): UserRecord | undefined {
  const db = getDatabase();
  return db.users.find(u => u.id === id);
}

/**
 * Add a user
 */
export function addUser(user: UserRecord): void {
  const db = getDatabase();
  db.users.push(user);
  saveDatabase(db);
}

/**
 * Update a user
 */
export function updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
  const db = getDatabase();
  const index = db.users.findIndex(u => u.id === id);
  
  if (index === -1) return undefined;
  
  db.users[index] = { ...db.users[index], ...updates };
  saveDatabase(db);
  
  return db.users[index];
}

/**
 * Delete a user
 */
export function deleteUser(id: string): boolean {
  const db = getDatabase();
  const initialLength = db.users.length;
  db.users = db.users.filter(u => u.id !== id);
  
  if (db.users.length !== initialLength) {
    saveDatabase(db);
    return true;
  }
  
  return false;
}
