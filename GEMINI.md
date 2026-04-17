# 🤖 NagaraVaani (Puttanaiha Foundation) - GEMINI.md

This document provides foundational context and instructions for AI agents working on the NagaraVaani project. NagaraVaani is a full-stack agentic platform designed as a citizen complaint portal and AI helpdesk for Mandya, Karnataka.

## 🌟 Project Overview

NagaraVaani (City Voice) bridges the gap between citizens and local government through a modern, real-time platform. It features a premium React-based frontend and a robust Node.js backend with local AI integration.

### Core Technologies
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Framer Motion, Radix UI, Lucide Icons, Leaflet (Maps).
- **Backend**: Node.js, Express.js (ES Modules), Better-SQLite3 (Local DB), Supabase (Cloud Storage), Multer (File Uploads).
- **AI/Communication**: Gemma 2B via Ollama (Local AI), WhatsApp-Web.js, Twilio.

### Key Features
- **Complaint Portal**: Citizens can report issues with photo uploads and geolocation.
- **AI HelpDesk**: Local AI model (Gemma 2B) for Q&A, translation (English/Kannada), and FAQ.
- **Community Feed**: Real-time view of reported issues and their status.
- **Admin Dashboard**: For department-level management and status updates.
- **WhatsApp Integration**: Report issues or ask questions via WhatsApp.

---

## 🎨 Visual & Functional Overview

NagaraVaani features a premium, modern UI designed with a "Heritage Tech" aesthetic, blending traditional Mandya sensibilities with high-performance React interactions.

### 🌈 Color Scheme & Typography
- **Core Palette**: 
  - **Cream (#F8F6F2)**: Primary background for a warm, paper-like feel.
  - **Charcoal (#2D2A26)**: Primary text and high-contrast elements.
  - **Teal (#5BB3A4)**: Action buttons and primary accents.
  - **Sand (#C4A574)**: Subtle borders and secondary UI elements.
- **Dark Mode**: Fully supported via Tailwind's `dark` class, switching to a deep charcoal/blue background (`#0d1117`) with light-gray text for night-time accessibility.
- **Typography**: 
  - **Playfair Display (Serif)**: For elegant, authoritative headings.
  - **Inter (Sans)**: For crisp, readable body text and functional UI.

### ✨ Animations & Motion
- **Framer Motion**: Extensive use of entrance animations (`fade-up`), staggered list items, and smooth page transitions.
- **Hero Collage**: Floating, interactive PNG cutouts of civic workers (traffic police, linemen, etc.) that subtly drift using sine-wave animations.
- **Waveform UI**: A dynamic, scale-based CSS animation used in the AI HelpDesk to indicate active listening or processing.
- **Interaction**: Smooth-scroll behavior, hover-triggered link underlines, and glassmorphism overlays on fixed map backgrounds.

### 📄 Page-by-Page Breakdown

#### 1. Landing Page (`/`)
- **Hero**: High-impact bilingual headline ("Your City. Your Voice. Your Fix.") with a dynamic collage of Mandya's civic heroes.
- **Fixed Map Background**: A low-opacity Leaflet map of Mandya follows the user's scroll, creating a sense of local groundedness.
- **Service Sections**: Highlights for "Specialties" (Roads, Water, Power) and "How it Works."

#### 2. Complaint Portal (`/raise`)
- **Wizard Flow**: A 4-step reporting process (Location -> Evidence -> Details -> Confirmation).
- **Geo-tagging**: Integrated Leaflet picker for precise issue marking, supporting auto-GPS detection.
- **Media Upload**: Multi-file photo uploader with real-time previews.

#### 3. Live City Map (`/map`)
- **Real-time Visualization**: Interactive markers for all public complaints, color-coded by category (e.g., Red for Roads, Blue for Water).
- **Filtering**: Sidebars or headers to filter by Status (Pending, Resolved) and Department.

#### 4. AI HelpDesk (`/ai`)
- **Conversational UI**: A modern chat interface powered by the local Gemma 2B model.
- **Voice Features**: Integrated Speech-to-Text for reporting issues via voice.
- **Live Translation**: Toggle between English and Kannada for all AI responses.

#### 5. Community Feed (`/feed`)
- **Public Ledger**: A chronological list of civic issues with upvoting capabilities to show community priority.
- **Status Badges**: High-visibility tags showing the lifecycle of a complaint (e.g., "In Progress," "Resolved").

#### 6. Admin & User Dashboards
- **Citizen Profile**: Personal history of reported issues and their resolution status.
- **Admin Panel**: Backend-access for department heads to manage incoming reports and update statuses.

---

## 🚀 Building and Running

### Prerequisites
- **Node.js**: v18 or higher.
- **Ollama**: Required for local AI functionality (`ollama run gemma:2b`).
- **SQLite**: Local database (`nagaravaani.db`).

### Commands

#### Root Directory
There are no global scripts; manage the frontend and backend separately.

#### Frontend (`app/`)
```bash
cd app
npm install     # Install dependencies
npm run dev     # Start Vite development server (http://localhost:5173)
npm run build   # Build for production
npm run lint    # Run ESLint
```

#### Backend (`backend/`)
```bash
cd backend
npm install     # Install dependencies
npm run dev     # Start server with watch mode (http://localhost:3000)
npm run start   # Start production server
```

---

## 📂 Project Structure

- `app/`: React Vite application.
  - `src/components/ui/`: shadcn/ui and custom UI components.
  - `src/sections/`: High-level landing page sections.
  - `src/pages/`: Main application routes (Map, Feed, Portal, AI, etc.).
  - `src/lib/`: Utilities and translations.
- `backend/`: Express.js server.
  - `routes/`: API endpoints for AI, complaints, departments, and users.
  - `uploads/`: Local storage for complaint photos.
  - `nagaravaani.db`: SQLite database file.
  - `server.js`: Main entry point.

---

## 🛠️ Development Conventions

- **Frontend Styling**: Use Tailwind CSS for styling. For animations, prefer Framer Motion.
- **Components**: Follow the `shadcn/ui` pattern. Keep components surgical and modular.
- **Types**: Use TypeScript for all frontend code. Ensure Zod schemas match the backend expectations.
- **Backend**: Use ES Modules (`import`/`export`). Maintain the "Zero-cost stack" philosophy where possible.
- **AI Interactions**: All AI logic should ideally route through the backend `aiRouter` to leverage the local Ollama instance.
- **Local First**: The project is optimized for local execution (M2 Air target) but uses Supabase for cloud-ready features.

## 📝 Note on AI Support
When responding to queries or assisting with code, prioritize the **Premium UI/UX** aesthetic (glassmorphism, smooth transitions) and ensure **Mandya-specific** context (latitude: 12.5218, longitude: 76.8951) is maintained for mapping features.
