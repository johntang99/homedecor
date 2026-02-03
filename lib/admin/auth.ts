import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import type { User, Session } from '@/lib/types';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const TOKEN_EXPIRY = '7d';
const USERS_FILE = path.join(process.cwd(), 'content', '_admin', 'users.json');

interface UserRecord extends User {
  passwordHash: string;
}

async function loadUsers(): Promise<UserRecord[]> {
  try {
    const content = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}

async function saveUsers(users: UserRecord[]): Promise<void> {
  const dir = path.dirname(USERS_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await loadUsers();
  return users.find((user) => user.email === email) || null;
}

export async function authenticate(email: string, password: string): Promise<Session | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;

  const users = await loadUsers();
  const userIndex = users.findIndex((u) => u.id === user.id);
  if (userIndex !== -1) {
    users[userIndex].lastLoginAt = new Date().toISOString();
    await saveUsers(users);
  }

  const userWithoutPassword: User = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    sites: user.sites,
    avatar: user.avatar,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  return {
    user: userWithoutPassword,
    expiresAt: expiresAt.toISOString(),
    token,
  };
}

export async function verifyAuth(token: string): Promise<Session | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; exp: number };
    const user = await findUserByEmail(decoded.email);
    if (!user) return null;

    const userWithoutPassword: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sites: user.sites,
      avatar: user.avatar,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };

    return {
      user: userWithoutPassword,
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      token,
    };
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('admin-token')?.value;
  if (!token) return null;
  return verifyAuth(token);
}

export async function getSessionFromRequest(request: NextRequest): Promise<Session | null> {
  const token = request.cookies.get('admin-token')?.value;
  if (!token) return null;
  return verifyAuth(token);
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: User['role'],
  sites: string[] = []
): Promise<User> {
  const users = await loadUsers();
  if (users.some((u) => u.email === email)) {
    throw new Error('User already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: UserRecord = {
    id: `user-${Date.now()}`,
    email,
    name,
    role,
    sites,
    passwordHash,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  users.push(newUser);
  await saveUsers(users);

  const { passwordHash: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  const users = await loadUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  users[userIndex] = {
    ...users[userIndex],
    ...updates,
  };

  await saveUsers(users);
  const { passwordHash: _, ...userWithoutPassword } = users[userIndex];
  return userWithoutPassword;
}

export async function deleteUser(userId: string): Promise<void> {
  const users = await loadUsers();
  const filtered = users.filter((u) => u.id !== userId);
  if (filtered.length === users.length) {
    throw new Error('User not found');
  }
  await saveUsers(filtered);
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const users = await loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found');

  const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isValid) throw new Error('Invalid current password');

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await saveUsers(users);
}
