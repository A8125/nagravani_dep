# Clarion Health Website - Technical Specification

## 1. Tech Stack Overview

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS 3.4 |
| UI Components | shadcn/ui |
| Animation | Framer Motion |
| Icons | Lucide React |
| Fonts | Google Fonts (Playfair Display, Inter) |

## 2. Tailwind Configuration Guide

### Color Extensions

```javascript
// tailwind.config.js colors extension
colors: {
  background: '#F8F6F2',
  foreground: '#2D2A26',
  primary: {
    DEFAULT: '#2D2A26',
    foreground: '#FFFFFF',
  },
  secondary: {
    DEFAULT: '#6B6560',
    foreground: '#FFFFFF',
  },
  accent: {
    DEFAULT: '#C4A574',
    foreground: '#2D2A26',
  },
  muted: {
    DEFAULT: '#E5E2DD',
    foreground: '#6B6560',
  },
  card: {
    DEFAULT: '#FFFFFF',
    foreground: '#2D2A26',
  },
  border: '#E5E2DD',
  teal: {
    light: '#7ECDC0',
    DEFAULT: '#5BB3A4',
    dark: '#4A9B8E',
  },
}
```

### Font Extensions

```javascript
// tailwind.config.js fontFamily extension
fontFamily: {
  serif: ['Playfair Display', 'Georgia', 'serif'],
  sans: ['Inter', 'system-ui', 'sans-serif'],
}
```

## 3. Component Inventory

### Shadcn/UI Components (Pre-installed)

| Component | Usage | Customization |
|-----------|-------|---------------|
| Button | CTAs, nav buttons | Custom rounded-full, sizes |
| DropdownMenu | "By Specialty" nav | Custom styling |
| Card | Feature cards | Remove shadow, add border |
| Badge | Specialty pills | Dark bg, white text |
| Separator | Section dividers | Muted color |

### Custom Components

| Component | Props | Description |
|-----------|-------|-------------|
| `Navbar` | `scrolled: boolean` | Fixed nav with scroll effect |
| `HeroSection` | none | Two-column hero with waveform |
| `TrustedBy` | `logos: Logo[]` | Logo row section |
| `FeatureCard` | `icon, title, description` | Individual feature card |
| `FeaturesSection` | none | 2x2 feature grid |
| `SpecialtyPill` | `name, href` | Clickable specialty badge |
| `SpecialtiesSection` | none | Horizontal scrolling specialties |
| `StepCard` | `number, title, description` | How it works step |
| `HowItWorksSection` | none | 3-step process |
| `CTASection` | none | Final call-to-action |
| `Footer` | none | Multi-column footer |
| `AudioWaveform` | none | Animated waveform visual |

## 4. Animation Implementation Plan

| Interaction Name | Tech Choice | Implementation Logic |
|------------------|-------------|---------------------|
| Page Load | Framer Motion | `staggerChildren: 0.1` on container, `y: 20→0, opacity: 0→1` on children |
| Navbar Scroll | React State + CSS | `useScroll` hook toggles `scrolled` class for bg/shadow |
| Hero Text Reveal | Framer Motion | `variants` with stagger, each line delays 0.1s |
| Audio Waveform Pulse | CSS Animation | `@keyframes pulse` with varying delays per bar |
| Section Fade In | Framer Motion | `whileInView` with `y: 40→0, opacity: 0→1` |
| Card Stagger | Framer Motion | Parent `staggerChildren: 0.15`, children fade up |
| Button Hover | Tailwind + Framer | `whileHover: { scale: 1.02 }`, Tailwind for colors |
| Card Hover | Framer Motion | `whileHover: { y: -4 }` |
| Link Underline | CSS | `::after` pseudo-element width animation |
| Dropdown Open | Framer Motion | `AnimatePresence` with fade + slide |
| Specialty Scroll | CSS/Framer | Horizontal scroll with snap or auto-scroll |

### Animation Timing Specs

```javascript
// Standard easing curves
const easeOut = [0.4, 0, 0.2, 1];
const easeSpring = [0.34, 1.56, 0.64, 1];

// Durations
const microDuration = 0.2;      // 200ms - hovers, micro-interactions
const standardDuration = 0.3;   // 300ms - transitions
const scrollDuration = 0.6;     // 600ms - scroll reveals
const pageLoadDuration = 0.8;   // 800ms - page load sequence

// Stagger delays
const textStagger = 0.1;        // 100ms between text lines
const cardStagger = 0.15;       // 150ms between cards
```

## 5. Project File Structure

```
/mnt/okcomputer/output/app/
├── public/
│   └── images/
│       └── hero-waveform.jpg    # Generated hero image
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   └── separator.tsx
│   │   ├── Navbar.tsx
│   │   ├── AudioWaveform.tsx
│   │   ├── FeatureCard.tsx
│   │   ├── SpecialtyPill.tsx
│   │   ├── StepCard.tsx
│   │   └── LogoItem.tsx
│   ├── sections/
│   │   ├── HeroSection.tsx
│   │   ├── TrustedBySection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── SpecialtiesSection.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── CTASection.tsx
│   │   └── Footer.tsx
│   ├── hooks/
│   │   └── useScrollPosition.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## 6. Package Installation List

```bash
# Animation library
npm install framer-motion

# Icons
npm install lucide-react

# Utility
npm install clsx tailwind-merge
```

## 7. Key Implementation Notes

### Navbar Scroll Effect
```typescript
// useScrollPosition hook
const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    setScrolled(window.scrollY > 20);
  };
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

### Framer Motion Variants
```typescript
// Container variant for stagger
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Item variant for fade up
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};
```

### Audio Waveform CSS Animation
```css
@keyframes waveform {
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1); }
}

.waveform-bar {
  animation: waveform 1.2s ease-in-out infinite;
}

.waveform-bar:nth-child(odd) {
  animation-delay: 0.1s;
}
```

## 8. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Single column, stacked sections |
| Tablet | 640-1024px | 2 columns where applicable |
| Desktop | > 1024px | Full layout as designed |

## 9. Accessibility Considerations

- All interactive elements keyboard accessible
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text for images
- Focus visible states
- Reduced motion support via `prefers-reduced-motion`
- Sufficient color contrast (WCAG AA)
