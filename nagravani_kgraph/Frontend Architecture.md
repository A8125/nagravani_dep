---
tags: [frontend, react, routing, pages, components]
---

# Frontend Architecture

## Tech Stack

- **React 19** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Framer Motion** (animations)
- **React-Leaflet** (maps)
- **Recharts** (charts)
- **Lucide React** (icons)
- **Radix UI** (headless primitives: dialog, drawer, accordion, etc.)
- **React Router** (client-side routing)

## Routes (`App.tsx`)

| Path | Page | File |
|------|------|------|
| `/` | Landing page (Hero, Features, How It Works, etc.) | `sections/*` |
| `/map` | Interactive Leaflet map of complaints | `pages/MapPage.tsx` |
| `/raise` | Complaint submission form | `pages/ComplaintPortal.tsx` |
| `/feed` | Community feed with filters + detail dialog | `pages/CommunityFeed.tsx` |
| `/garbage` | Garbage tracker with schedules & missed reports | `pages/GarbageTracker.tsx` |
| `/departments` | Public department directory | `pages/DepartmentDirectory.tsx` |
| `/ai` | AI help desk chatbot | `pages/AIHelpDesk.tsx` |
| `/profile` | Citizen dashboard (complaints, notifications) | `pages/CitizenDashboard.tsx` |
| `/admin` | Admin dashboard | `pages/AdminDashboard.tsx` |
| `/gov` | Government login | `pages/gov/GovLogin.tsx` |
| `/gov/dashboard` | Government complaint management | `pages/gov/GovDashboard.tsx` |

## Key Pages

### Landing Page

Sections: Hero, Live Complaints Preview, Trusted By, Features, Specialties, How It Works, CTA. Fixed Leaflet map background of Mandya.

### Community Feed (`/feed`)

- Filterable by category, status, department
- Photo gallery with left/right navigation + dot indicators
- "Add Me Too" upvote button
- Comment button opens detail dialog/drawer
- Share button (native share on mobile, clipboard on desktop)
- Detail dialog (desktop) / drawer (mobile) with:
  - Problem info + linked citizen reports
  - Photo gallery
  - Discussion section with comment form

### Complaint Portal (`/raise`)

- Multi-step form: category, title, description, ward, location (map picker), photo upload, citizen details, Aadhaar
- Submits via `POST /api/report` with `FormData`

### Map Page (`/map`)

- Full-screen Leaflet map with complaint markers
- Filterable by category
- Popup with complaint details on marker click

### Government Portal (`/gov`)

See [[Government Portal]].

## State Management

- **AppContext**: Language toggle only (`lang: 'en' | 'kn'`)
- **Local state**: Each page manages its own state with `useState`
- **API client**: `app/src/lib/api.ts` — typed fetch wrappers with `req<T>()` helper

## Key UI Components

- `Navbar` — Top navigation bar
- `components/ui/` — Radix-based: Button, Input, Textarea, Dialog, Drawer, Accordion, etc.
- `ToastPill` — Toast notification component

## Related

- [[Nagravani]]
- [[Complaint_System_Architecture]]
- [[Government Portal]]
- [[Engagement Features]]
