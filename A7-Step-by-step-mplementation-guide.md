# Admin Dashboard - Step-by-Step Implementation Guide

## 1. Overview

This document provides a complete step-by-step guide to implement the admin dashboard from scratch. Follow these phases in order for a systematic implementation.

## 2. Prerequisites

Before starting, ensure you have:

- ✅ Next.js 14+ project set up
- ✅ TypeScript configured
- ✅ Tailwind CSS installed
- ✅ Existing content structure in place (`content/` directory)
- ✅ Node.js 18+ installed
- ✅ Basic understanding of Next.js App Router

## 3. Phase 1: Foundation Setup (Week 1)

### Step 1.1: Install Dependencies

```bash
# Navigate to your project
cd medical-clinic/chinese-medicine

# Install required dependencies
npm install jsonwebtoken bcryptjs zod react-hook-form @hookform/resolvers/zod
npm install sharp uuid
npm install react-dropzone

# Install dev dependencies
npm install -D @types/jsonwebtoken @types/bcryptjs @types/uuid

# Install UI components (if using shadcn/ui)
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label textarea select dialog tabs accordion alert progress badge dropdown-menu
```

### Step 1.2: Set Up Environment Variables

Create or update `.env.local`:

```bash
# .env.local
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

**Important:** Generate a secure JWT secret:
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 1.3: Update TypeScript Config

Add admin types to `lib/types.ts`:

```typescript
// lib/types.ts

// Add to existing types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'site_admin' | 'editor' | 'viewer';
  sites: string[];
  avatar?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface Session {
  user: User;
  expiresAt: string;
  token: string;
}

export interface ImageMetadata {
  id: string;
  siteId: string;
  filename: string;
  path: string;
  url: string;
  thumbnailUrl?: string;
  webpUrl?: string;
  category: string;
  alt: string;
  title?: string;
  width: number;
  height: number;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  usedIn: string[];
}
```

### Step 1.4: Create Admin Directory Structure

```bash
# Create directory structure
mkdir -p app/admin/{login,sites}
mkdir -p app/api/admin/{auth,sites,users}
mkdir -p components/admin
mkdir -p lib/admin
mkdir -p content/_admin
```

### Step 1.5: Create Initial Admin User

Create `content/_admin/users.json`:

```json
[
  {
    "id": "admin-1",
    "email": "admin@example.com",
    "name": "Super Admin",
    "role": "super_admin",
    "sites": [],
    "passwordHash": "$2a$10$...",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-01T00:00:00Z"
  }
]
```

**Generate password hash:**
```bash
# Run this in Node.js console or create a script
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10, (err, hash) => console.log(hash));"
```

Replace `"passwordHash": "$2a$10$..."` with the generated hash.

## 4. Phase 2: Authentication System (Week 1-2)

### Step 2.1: Create Authentication Library

Create `lib/admin/auth.ts` with the complete code from Document #5 (Authentication & Authorization).

**Key functions to implement:**
- `authenticate(email, password)` - Login
- `verifyAuth(token)` - Verify JWT
- `getSession()` - Get current session
- `createUser()` - Create new user
- `updateUser()` - Update user
- `changePassword()` - Change password

### Step 2.2: Create Middleware

Create `middleware.ts` in project root:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from './lib/admin/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip public routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/public') ||
    path.startsWith('/uploads') ||
    !path.startsWith('/admin')
  ) {
    return NextResponse.next();
  }

  // Allow login page
  if (path === '/admin/login') {
    return NextResponse.next();
  }

  // Check authentication
  const token = request.cookies.get('admin-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const session = await verifyAuth(token);

  if (!session) {
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete('admin-token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

### Step 2.3: Create Login Page

Create `app/admin/login/page.tsx`:

```typescript
// app/admin/login/page.tsx
import { LoginForm } from '@/components/admin/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Medical Clinic CMS</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <LoginForm />
        </div>

        <p className="text-center mt-6 text-sm text-gray-600">
          Default: admin@example.com / admin123
        </p>
      </div>
    </div>
  );
}
```

Create `components/admin/LoginForm.tsx` with the complete code from Document #5.

### Step 2.4: Create Auth API Routes

Create `app/api/admin/auth/login/route.ts`:

```typescript
// app/api/admin/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/admin/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const session = await authenticate(email, password);

    if (!session) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

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
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Create `app/api/admin/auth/logout/route.ts`:

```typescript
// app/api/admin/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  cookies().delete('admin-token');
  return NextResponse.json({ success: true });
}
```

Create `app/api/admin/auth/session/route.ts`:

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

### Step 2.5: Test Authentication

```bash
# Start dev server
npm run dev

# Navigate to http://localhost:3003/admin
# Should redirect to /admin/login

# Try logging in with:
# Email: admin@example.com
# Password: admin123

# Should redirect to /admin/sites
```

## 5. Phase 3: Admin Layout & Navigation (Week 2)

### Step 3.1: Create Admin Layout

Create `app/admin/layout.tsx`:

```typescript
// app/admin/layout.tsx
import { getSession } from '@/lib/admin/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar user={session.user} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <AdminTopBar user={session.user} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Step 3.2: Create Sidebar Component

Create `components/admin/AdminSidebar.tsx`:

```typescript
// components/admin/AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/lib/types';
import {
  LayoutDashboard,
  Globe,
  FileText,
  Image,
  Palette,
  Users,
  Settings,
} from 'lucide-react';

interface AdminSidebarProps {
  user: User;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: 'Sites',
      href: '/admin/sites',
      icon: Globe,
      show: true,
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: Users,
      show: user.role === 'super_admin',
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      show: true,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-blue-600">Admin</h1>
        <p className="text-sm text-gray-600">Medical Clinic CMS</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          if (!item.show) return null;

          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

### Step 3.3: Create Top Bar Component

Create `components/admin/AdminTopBar.tsx`:

```typescript
// components/admin/AdminTopBar.tsx
'use client';

import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, LogOut, User as UserIcon, Settings } from 'lucide-react';

interface AdminTopBarProps {
  user: User;
}

export function AdminTopBar({ user }: AdminTopBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
      {/* Breadcrumb or Title */}
      <div>
        <h2 className="text-xl font-semibold">Dashboard</h2>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span>{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-2">
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

### Step 3.4: Create Dashboard Home Page

Create `app/admin/page.tsx`:

```typescript
// app/admin/page.tsx
import { getSession } from '@/lib/admin/auth';
import { getAllSites } from '@/lib/admin/site-manager';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const sites = await getAllSites(session.user);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Welcome, {session.user.name}!</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Sites"
          value={sites.length}
          icon="🏥"
          color="blue"
        />
        <StatCard
          title="Active Sites"
          value={sites.filter(s => s.status === 'active').length}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Draft Sites"
          value={sites.filter(s => s.status === 'draft').length}
          icon="📝"
          color="yellow"
        />
        <StatCard
          title="Total Pages"
          value={sites.length * 5} // Approximate
          icon="📄"
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-4">
          <QuickActionCard
            title="Manage Sites"
            description="View and edit your clinic websites"
            href="/admin/sites"
            icon="🏥"
          />
          <QuickActionCard
            title="Upload Images"
            description="Add new images to your gallery"
            href="/admin/sites"
            icon="📸"
          />
          <QuickActionCard
            title="User Management"
            description="Manage admin users and permissions"
            href="/admin/users"
            icon="👥"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`text-4xl ${colorClasses[color]} p-4 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, href, icon }: any) {
  return (
    <a
      href={href}
      className="block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
  );
}
```

## 6. Phase 4: Site Management (Week 2-3)

### Step 4.1: Create Site Manager Library

Create `lib/admin/site-manager.ts` with the complete code from Document #2.

**Key functions:**
- `getAllSites(user)` - List all sites
- `getSite(siteId)` - Get single site
- `createSite(data)` - Create new site
- `updateSite(siteId, updates)` - Update site
- `deleteSite(siteId)` - Delete site

### Step 4.2: Create Sites List Page

Create `app/admin/sites/page.tsx` with the complete code from Document #2.

### Step 4.3: Create Site API Routes

Create `app/api/admin/sites/route.ts` and `app/api/admin/sites/[siteId]/route.ts` with the complete code from Document #6.

### Step 4.4: Test Site Management

```bash
# Navigate to http://localhost:3003/admin/sites
# Should see list of existing sites (dr-huang-clinic, etc.)
# Try creating a new site
# Try editing site settings
```

## 7. Phase 5: Content Editor (Week 3-4)

### Step 5.1: Create Content Manager Library

Create `lib/admin/content-manager.ts` with the complete code from Document #3.

### Step 5.2: Create Content Editor Pages

Create the following files with code from Document #3:
- `app/admin/sites/[siteId]/content/page.tsx`
- `app/admin/sites/[siteId]/content/[locale]/[pageName]/page.tsx`

### Step 5.3: Create Editor Components

Create the following components from Document #3:
- `components/admin/ContentEditorClient.tsx`
- `components/admin/FormEditor.tsx`
- `components/admin/JsonEditor.tsx`
- `components/admin/PreviewPanel.tsx`

### Step 5.4: Create Content API Routes

Create content API routes from Document #6:
- `app/api/admin/sites/[siteId]/content/route.ts`
- `app/api/admin/sites/[siteId]/content/[locale]/[pageName]/route.ts`

## 8. Phase 6: Image Management (Week 4-5)

### Step 6.1: Create Image Manager Library

Create `lib/admin/image-manager.ts`:

```typescript
// lib/admin/image-manager.ts
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { ImageMetadata } from '@/lib/types';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const IMAGE_REGISTRY_DIR = path.join(process.cwd(), 'content');

/**
 * Get all images for a site
 */
export async function getImages(
  siteId: string,
  category?: string
): Promise<ImageMetadata[]> {
  try {
    const registryPath = path.join(IMAGE_REGISTRY_DIR, siteId, 'images.json');
    const content = await fs.readFile(registryPath, 'utf-8');
    const data = JSON.parse(content);
    
    let images = data.images || [];
    
    if (category) {
      images = images.filter((img: ImageMetadata) => img.category === category);
    }
    
    return images;
  } catch (error) {
    return [];
  }
}

/**
 * Get single image
 */
export async function getImage(
  siteId: string,
  imageId: string
): Promise<ImageMetadata | null> {
  const images = await getImages(siteId);
  return images.find(img => img.id === imageId) || null;
}

/**
 * Upload and process image
 */
export async function uploadImage({
  siteId,
  file,
  category,
  alt,
  uploadedBy,
}: {
  siteId: string;
  file: File;
  category: string;
  alt: string;
  uploadedBy: string;
}): Promise<ImageMetadata> {
  const id = `img_${uuidv4()}`;
  const ext = path.extname(file.name);
  const baseName = path.basename(file.name, ext);
  const filename = `${baseName}-${Date.now()}${ext}`;
  
  // Create directories
  const siteUploadDir = path.join(UPLOADS_DIR, siteId, category);
  await fs.mkdir(siteUploadDir, { recursive: true });
  
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Save original
  const originalPath = path.join(siteUploadDir, filename);
  await fs.writeFile(originalPath, buffer);
  
  // Get image dimensions
  const metadata = await sharp(buffer).metadata();
  
  // Generate WebP version
  const webpFilename = `${baseName}-${Date.now()}.webp`;
  const webpPath = path.join(siteUploadDir, webpFilename);
  await sharp(buffer)
    .webp({ quality: 85 })
    .toFile(webpPath);
  
  // Generate thumbnail
  const thumbFilename = `${baseName}-${Date.now()}-thumb.webp`;
  const thumbPath = path.join(siteUploadDir, thumbFilename);
  await sharp(buffer)
    .resize(400, 400, { fit: 'inside' })
    .webp({ quality: 80 })
    .toFile(thumbPath);
  
  // Create metadata
  const imageMetadata: ImageMetadata = {
    id,
    siteId,
    filename,
    path: `/uploads/${siteId}/${category}/${filename}`,
    url: `/uploads/${siteId}/${category}/${webpFilename}`,
    thumbnailUrl: `/uploads/${siteId}/${category}/${thumbFilename}`,
    webpUrl: `/uploads/${siteId}/${category}/${webpFilename}`,
    category,
    alt,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: buffer.length,
    mimeType: file.type,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
    usedIn: [],
  };
  
  // Save to registry
  await saveImageToRegistry(siteId, imageMetadata);
  
  return imageMetadata;
}

/**
 * Update image metadata
 */
export async function updateImageMetadata(
  siteId: string,
  imageId: string,
  updates: Partial<ImageMetadata>
): Promise<ImageMetadata> {
  const images = await getImages(siteId);
  const index = images.findIndex(img => img.id === imageId);
  
  if (index === -1) {
    throw new Error('Image not found');
  }
  
  images[index] = { ...images[index], ...updates };
  
  const registryPath = path.join(IMAGE_REGISTRY_DIR, siteId, 'images.json');
  await fs.writeFile(
    registryPath,
    JSON.stringify({ images }, null, 2)
  );
  
  return images[index];
}

/**
 * Delete image
 */
export async function deleteImage(
  siteId: string,
  imageId: string
): Promise<void> {
  const image = await getImage(siteId, imageId);
  if (!image) throw new Error('Image not found');
  
  // Delete files
  const files = [image.path, image.webpUrl, image.thumbnailUrl].filter(Boolean);
  
  for (const filePath of files) {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.error(`Failed to delete file: ${fullPath}`, error);
    }
  }
  
  // Remove from registry
  const images = await getImages(siteId);
  const filtered = images.filter(img => img.id !== imageId);
  
  const registryPath = path.join(IMAGE_REGISTRY_DIR, siteId, 'images.json');
  await fs.writeFile(
    registryPath,
    JSON.stringify({ images: filtered }, null, 2)
  );
}

/**
 * Save image to registry
 */
async function saveImageToRegistry(
  siteId: string,
  image: ImageMetadata
): Promise<void> {
  const registryPath = path.join(IMAGE_REGISTRY_DIR, siteId, 'images.json');
  
  let images: ImageMetadata[] = [];
  try {
    const content = await fs.readFile(registryPath, 'utf-8');
    const data = JSON.parse(content);
    images = data.images || [];
  } catch (error) {
    // File doesn't exist, create new
  }
  
  images.push(image);
  
  await fs.writeFile(
    registryPath,
    JSON.stringify({ images }, null, 2)
  );
}
```

### Step 6.2: Create Image Gallery Pages

Create image management pages from Document #4:
- `app/admin/sites/[siteId]/images/page.tsx`

### Step 6.3: Create Image Components

Create image components from Document #4:
- `components/admin/ImageGalleryClient.tsx`
- `components/admin/ImageUploader.tsx`
- `components/admin/ImageCard.tsx`
- `components/admin/ImageDetailModal.tsx`

### Step 6.4: Create Image API Routes

Create image API routes from Document #6:
- `app/api/admin/sites/[siteId]/images/route.ts`
- `app/api/admin/sites/[siteId]/images/[imageId]/route.ts`

## 9. Phase 7: Permissions & Authorization (Week 5)

### Step 7.1: Create Permissions Library

Create `lib/admin/permissions.ts` with complete code from Document #5.

### Step 7.2: Add Permission Checks

Update all API routes to include permission checks:

```typescript
// Example: Add to every API route
requirePermission(session.user, 'content.update');
requireSiteAccess(session.user, params.siteId);