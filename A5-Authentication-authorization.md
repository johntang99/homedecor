# Admin Dashboard - Authentication & Authorization

## 1. Overview

This document details how to implement secure authentication and role-based authorization for the admin dashboard, including login, session management, and permission controls.

## 2. Authentication Architecture

### 2.1 Authentication Flow

```
┌─────────────────────────────────────────┐
│     User visits /admin route            │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Middleware Check                │
│   Does session cookie exist?            │
└─────────────────────────────────────────┘
         │                    │
    NO   │                    │ YES
         ▼                    ▼
┌──────────────┐    ┌──────────────────────┐
│ Redirect to  │    │  Verify JWT Token    │
│ /admin/login │    │  Check expiration    │
└──────────────┘    └──────────────────────┘
                              │
                    ┌─────────┴─────────┐
               INVALID │             │ VALID
                       ▼             ▼
              ┌──────────────┐  ┌────────────┐
              │ Clear cookie │  │ Allow      │
              │ Redirect to  │  │ access to  │
              │ /admin/login │  │ admin page │
              └──────────────┘  └────────────┘
```

### 2.2 Session Management

```typescript
// lib/types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'site_admin' | 'editor' | 'viewer';
  sites: string[];              // Site IDs user has access to
  avatar?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface Session {
  user: User;
  expiresAt: string;
  token: string;
}
```

## 3. Authentication Implementation

### 3.1 Middleware (Route Protection)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from './lib/admin/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes (no authentication required)
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/public') ||
    path.startsWith('/uploads') ||
    !path.startsWith('/admin')
  ) {
    return NextResponse.next();
  }

  // Allow access to login page
  if (path === '/admin/login') {
    return NextResponse.next();
  }

  // Check authentication for /admin routes
  const token = request.cookies.get('admin-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Verify JWT token
  const session = await verifyAuth(token);

  if (!session) {
    // Invalid or expired token
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete('admin-token');
    return response;
  }

  // Token is valid, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
```

### 3.2 Authentication Library

```typescript
// lib/admin/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Session } from '@/lib/types';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d'; // 7 days

/**
 * User storage (file-based for simplicity)
 * In production, use a database
 */
const USERS_FILE = path.join(process.cwd(), 'content', '_admin', 'users.json');

interface UserRecord extends User {
  passwordHash: string;
}

/**
 * Load users from file
 */
async function loadUsers(): Promise<UserRecord[]> {
  try {
    const content = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // Return default admin user if file doesn't exist
    return [
      {
        id: 'admin-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'super_admin',
        sites: [],
        passwordHash: await bcrypt.hash('admin123', 10), // Change in production!
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
    ];
  }
}

/**
 * Save users to file
 */
async function saveUsers(users: UserRecord[]): Promise<void> {
  const dir = path.dirname(USERS_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

/**
 * Find user by email
 */
async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await loadUsers();
  return users.find(u => u.email === email) || null;
}

/**
 * Authenticate user with email and password
 */
export async function authenticate(
  email: string,
  password: string
): Promise<Session | null> {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  // Update last login time
  const users = await loadUsers();
  const userIndex = users.findIndex(u => u.id === user.id);
  if (userIndex !== -1) {
    users[userIndex].lastLoginAt = new Date().toISOString();
    await saveUsers(users);
  }

  // Create session
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
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

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

/**
 * Verify JWT token and return session
 */
export async function verifyAuth(token: string): Promise<Session | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

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

/**
 * Get current session from cookies (Server Component)
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('admin-token')?.value;

  if (!token) return null;

  return verifyAuth(token);
}

/**
 * Get session from request (API Route)
 */
export async function getSessionFromRequest(
  request: NextRequest
): Promise<Session | null> {
  const token = request.cookies.get('admin-token')?.value;

  if (!token) return null;

  return verifyAuth(token);
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  password: string,
  name: string,
  role: User['role'],
  sites: string[] = []
): Promise<User> {
  const users = await loadUsers();

  // Check if user already exists
  if (users.some(u => u.email === email)) {
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

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  updates: Partial<User>
): Promise<User> {
  const users = await loadUsers();
  const userIndex = users.findIndex(u => u.id === userId);

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

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  const users = await loadUsers();
  const filtered = users.filter(u => u.id !== userId);

  if (filtered.length === users.length) {
    throw new Error('User not found');
  }

  await saveUsers(filtered);
}

/**
 * Change password
 */
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const users = await loadUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    throw new Error('User not found');
  }

  const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid current password');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await saveUsers(users);
}
```

### 3.3 Login Page

```typescript
// app/admin/login/page.tsx
import { LoginForm } from '@/components/admin/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Sign in to manage your clinics</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Need help? Contact support@example.com</p>
        </div>
      </div>
    </div>
  );
}
```

### 3.4 Login Form Component

```typescript
// components/admin/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      // Redirect to dashboard
      router.push('/admin/sites');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@example.com"
          {...form.register('email')}
          className="mt-1"
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative mt-1">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...form.register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      <div className="text-center">
        <a href="#" className="text-sm text-blue-600 hover:underline">
          Forgot your password?
        </a>
      </div>
    </form>
  );
}
```

### 3.5 Auth API Routes

```typescript
// app/api/admin/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/admin/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate
    const session = await authenticate(email, password);

    if (!session) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Set cookie
    cookies().set('admin-token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      user: session.user,
      expiresAt: session.expiresAt,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/admin/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  cookies().delete('admin-token');
  return NextResponse.json({ success: true });
}
```

```typescript
// app/api/admin/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { message: 'Not authenticated' },
      { status: 401 }
    );
  }

  return NextResponse.json(session);
}
```

## 4. Authorization (RBAC)

### 4.1 Permission System

```typescript
// lib/admin/permissions.ts
import { User } from '@/lib/types';

export type Permission = 
  | 'sites.create'
  | 'sites.read'
  | 'sites.update'
  | 'sites.delete'
  | 'content.create'
  | 'content.read'
  | 'content.update'
  | 'content.delete'
  | 'images.upload'
  | 'images.read'
  | 'images.delete'
  | 'theme.update'
  | 'users.create'
  | 'users.read'
  | 'users.update'
  | 'users.delete';

/**
 * Role-based permissions matrix
 */
const ROLE_PERMISSIONS: Record<User['role'], Permission[]> = {
  super_admin: [
    'sites.create',
    'sites.read',
    'sites.update',
    'sites.delete',
    'content.create',
    'content.read',
    'content.update',
    'content.delete',
    'images.upload',
    'images.read',
    'images.delete',
    'theme.update',
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
  ],
  site_admin: [
    'sites.read',
    'sites.update',
    'content.create',
    'content.read',
    'content.update',
    'content.delete',
    'images.upload',
    'images.read',
    'images.delete',
    'theme.update',
    'users.read',
  ],
  editor: [
    'sites.read',
    'content.read',
    'content.update',
    'images.upload',
    'images.read',
  ],
  viewer: [
    'sites.read',
    'content.read',
    'images.read',
  ],
};

/**
 * Check if user has permission
 */
export function hasPermission(
  user: User,
  permission: Permission
): boolean {
  const permissions = ROLE_PERMISSIONS[user.role];
  return permissions.includes(permission);
}

/**
 * Check if user can access a specific site
 */
export function canAccessSite(user: User, siteId: string): boolean {
  // Super admin can access all sites
  if (user.role === 'super_admin') return true;

  // Other roles must have site in their sites array
  return user.sites.includes(siteId);
}

/**
 * Require permission (throws error if not authorized)
 */
export function requirePermission(
  user: User,
  permission: Permission
): void {
  if (!hasPermission(user, permission)) {
    throw new Error('Insufficient permissions');
  }
}

/**
 * Require site access (throws error if not authorized)
 */
export function requireSiteAccess(user: User, siteId: string): void {
  if (!canAccessSite(user, siteId)) {
    throw new Error('No access to this site');
  }
}
```

### 4.2 Protected API Route Example

```typescript
// app/api/admin/sites/[siteId]/content/[locale]/[pageName]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { requirePermission, requireSiteAccess } from '@/lib/admin/permissions';
import { getPageContent, savePageContent } from '@/lib/admin/content-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string; locale: string; pageName: string } }
) {
  try {
    // 1. Authenticate
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check permissions
    requirePermission(session.user, 'content.read');
    requireSiteAccess(session.user, params.siteId);

    // 3. Load content
    const content = await getPageContent(
      params.siteId,
      params.locale,
      params.pageName
    );

    if (!content) {
      return NextResponse.json(
        { message: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(content);
  } catch (error: any) {
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { siteId: string; locale: string; pageName: string } }
) {
  try {
    // 1. Authenticate
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check permissions
    requirePermission(session.user, 'content.update');
    requireSiteAccess(session.user, params.siteId);

    // 3. Get request body
    const content = await request.json();

    // 4. Save content
    await savePageContent(
      params.siteId,
      params.locale,
      params.pageName,
      content
    );

    // 5. Log audit trail (optional)
    await logAudit({
      userId: session.user.id,
      action: 'UPDATE_CONTENT',
      resource: `${params.siteId}/${params.locale}/${params.pageName}`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Placeholder for audit logging
async function logAudit(entry: any) {
  // Implement audit trail logging here
  console.log('Audit:', entry);
}
```

### 4.3 Client-Side Permission Checks

```typescript
// components/admin/ProtectedAction.tsx
'use client';

import { useSession } from '@/hooks/useSession';
import { hasPermission } from '@/lib/admin/permissions';
import { Permission } from '@/lib/admin/permissions';

interface ProtectedActionProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedAction({
  permission,
  children,
  fallback = null,
}: ProtectedActionProps) {
  const { user } = useSession();

  if (!user || !hasPermission(user, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

**Usage Example:**
```typescript
<ProtectedAction permission="sites.create">
  <Button>
    <Plus className="w-4 h-4 mr-2" />
    New Site
  </Button>
</ProtectedAction>
```

### 4.4 Session Hook

```typescript
// hooks/useSession.ts
'use client';

import { useEffect, useState } from 'react';
import { User } from '@/lib/types';

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/admin/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/admin/login';
  };

  return { user, loading, logout };
}
```

## 5. Environment Variables

```bash
# .env.local
JWT_SECRET=your-very-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

## 6. Security Best Practices

### 6.1 Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

### 6.2 Rate Limiting
Implement rate limiting for login attempts:

```typescript
// lib/admin/rate-limiter.ts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(email);

  if (!record || now > record.resetAt) {
    loginAttempts.set(email, { count: 1, resetAt: now + 15 * 60 * 1000 }); // 15 min
    return true;
  }

  if (record.count >= 5) {
    return false; // Too many attempts
  }

  record.count++;
  return true;
}
```

### 6.3 CSRF Protection
Add CSRF token validation for state-changing operations.

### 6.4 Secure Headers
Configure security headers in `next.config.js`:

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

## 7. Testing Credentials

For development purposes:

```
Email: admin@example.com
Password: admin123

Role: super_admin
Access: All sites
```

**⚠️ IMPORTANT: Change these credentials in production!**

---

**Next: Document #6 - API Routes for CRUD Operations**