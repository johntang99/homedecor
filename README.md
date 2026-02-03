

# stop dev
lsof -ti:3003 | xargs kill -9

pkill -f "next dev"

rm -rf .next

npm run dev

1, 
npm run build

2, 
git add .
git commit -m "Fix bugs"
git push origin main

3, Then: Vercel deployment
curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_TWzpWZczAkIWaSOO8X2kvV5LnFsA/zENRbBnJ1z



Admin Default: admin@example.com / admin123





# TCM Multi-Site System

A comprehensive multi-site, multi-language Traditional Chinese Medicine (TCM) clinic website system.

## 🎯 System Overview

- **Industry**: Traditional Chinese Medicine / Acupuncture Clinics
- **Sites per System**: Up to 50 clinics
- **Languages**: English + Chinese (Simplified)
- **Content**: 100% editable (text, images, theme)
- **Database**: ❌ NO - File-based only

## 📁 Project Structure

```
medical-clinic/chinese-medicine/
├── app/                      # Next.js App Router
│   ├── [locale]/            # Internationalized routes
│   ├── admin/               # Admin dashboard (Phase 6-7)
│   └── api/                 # API routes
├── components/              # React components
│   ├── ui/                  # Reusable UI components (Phase 2)
│   ├── sections/            # Page sections (Phase 3-4)
│   ├── layout/              # Header, Footer
│   └── admin/               # Admin components (Phase 6-7)
├── lib/                     # Utilities
│   ├── types.ts            # TypeScript definitions
│   ├── i18n.ts             # Internationalization
│   ├── sites.ts            # Site management
│   ├── content.ts          # Content loading
│   └── utils.ts            # Helper functions
├── content/                 # Content files (JSON)
│   ├── _sites.json         # Site registry
│   └── [site-id]/          # Per-site content
│       ├── theme.json      # Theme variables
│       ├── en/             # English content
│       └── zh/             # Chinese content
├── public/uploads/          # Uploaded media
└── styles/                  # Global CSS
```

## 🚀 Getting Started

### Installation

```bash
cd medical-clinic/chinese-medicine
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000/en](http://localhost:3000/en) in your browser.

### Build

```bash
npm run build
npm start
```

## 📋 Development Phases

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Next.js 14+ project setup
- [x] Tailwind CSS with theme variables
- [x] File structure
- [x] i18n routing (`/en`, `/zh`)
- [x] Basic layout components
- [x] Content loading utilities
- [x] Sample content files

### 🚧 Phase 2: UI Component Library (Next)
- [ ] Button, Card, Badge, Icon
- [ ] Input, Textarea, Select
- [ ] Modal, Accordion, Tabs, Carousel
- [ ] Toast, Loading, Breadcrumb

### 📅 Phase 3: Homepage
- [ ] 12 homepage sections
- [ ] Theme customization
- [ ] Responsive design

### 📅 Phase 4: Remaining Pages
- [ ] Services, Conditions, About
- [ ] Gallery, Blog, Contact
- [ ] Pricing, New Patients

### 📅 Phase 5: Multi-Language
- [ ] Complete Chinese translations
- [ ] Language switcher
- [ ] Translation fallbacks

### 📅 Phase 6-7: Admin Dashboard
- [ ] Authentication
- [ ] Content editors
- [ ] Media library
- [ ] Theme editor

### 📅 Phase 8: Multi-Site
- [ ] Site management
- [ ] Content cloning
- [ ] Domain routing

## 🎨 Theme Customization

Edit `content/[site-id]/theme.json` to customize:

- Typography (5 variables)
- Primary colors (5 variables)
- Secondary colors (4 variables)
- Backdrop colors (2 variables)

Changes apply site-wide immediately.

## 🌐 Languages

- **English**: `/en/*` (default)
- **Chinese**: `/zh/*`

Add more languages by:
1. Adding locale to `lib/i18n.ts`
2. Creating content in `content/[site-id]/[locale]/`

## 📄 Pages

### Public Pages (10)
1. Home
2. Services
3. Conditions
4. About
5. Case Studies
6. Gallery
7. Pricing
8. Blog (+ detail pages)
9. Contact
10. New Patients

### Admin Pages (12)
1. Dashboard
2. Pages Editor
3-12. Content Managers

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Content**: JSON files
- **i18n**: Custom middleware
- **Hosting**: Vercel-ready

## 📝 Adding a New Site

1. Edit `content/_sites.json`:
```json
{
  "sites": [
    {
      "id": "new-clinic",
      "name": "New Clinic",
      "enabled": true,
      "defaultLocale": "en",
      "supportedLocales": ["en", "zh"]
    }
  ]
}
```

2. Create content directory:
```bash
mkdir -p content/new-clinic/en/pages
mkdir -p content/new-clinic/zh/pages
```

3. Copy theme and content from existing site

## 🤝 Contributing

This is a phased development project. Current phase: **Phase 1 Complete**.

## 📧 Support

For questions or issues, refer to the main project plan document.

---

**Phase 1 Complete** ✅ | Next: Phase 2 - UI Components
