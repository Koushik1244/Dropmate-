# DropMate MVP Design Guidelines - Polkadot Theme

## Design Approach

**Reference-Based + Design System Hybrid**: Drawing from Polkadot's visual language (gradient aesthetics, modern rounded components, bold typography) combined with Material Design principles for utility-focused ride-sharing interfaces.

**Core Principles:**
- Polkadot's signature gradient aesthetic adapted for fintech/web3 context
- Clean, dashboard-focused layouts emphasizing real-time information
- Crisp borders and elevated cards for data hierarchy
- Trust-building through professional polish and clear information architecture

## Typography System

**Font Stack**: Inter (via Google Fonts CDN) for all text
- **Hero/Headers**: text-4xl to text-6xl, font-bold (48-60px)
- **Section Titles**: text-2xl to text-3xl, font-semibold (24-30px)
- **Body/Dashboard**: text-base, font-normal (16px)
- **Captions/Metadata**: text-sm, font-medium (14px)
- **Buttons/CTAs**: text-lg, font-semibold (18px)

## Layout & Spacing System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-6 to p-8
- Section spacing: py-12 to py-16
- Card gaps: gap-4 to gap-6
- Button padding: px-8 py-4

**Container Strategy:**
- Max-width dashboards: max-w-7xl mx-auto
- Forms/modals: max-w-2xl
- Cards: Full width within containers with proper gutters

## Component Architecture

### 1. Auth/Wallet Connection Page
**Layout**: Centered single-column (max-w-md)
- Logo placement: Top center with mb-8
- Role selection cards: 2-column grid (grid-cols-2 gap-4)
- Wallet connect button: Full-width, prominent
- Connected state: Compact header bar with address truncation

### 2. Customer Dashboard
**Layout**: Single-column with clear sections
- Header: Sticky top bar (h-16) with wallet + balance right-aligned
- Primary CTA: Large centered button (min-h-20, w-full md:w-auto)
- Active Ride Card: Elevated card (shadow-lg) with embedded map (h-64)
- Ride History: 3-column grid on desktop (grid-cols-1 md:grid-cols-3 gap-6)

**Active Ride Card Structure:**
- Map container: aspect-video with rounded-t-xl
- Info panel below: p-6 with metadata grid (2 columns)
- Status badge: Top-right absolute positioning
- Action buttons: Bottom, full-width within card

### 3. Ride Request Modal
**Layout**: Centered overlay modal (max-w-lg)
- Form fields: Stacked with mb-4 spacing
- Map preview: h-48 rounded-lg between pickup/dropoff inputs
- Fare estimate: Large text-3xl font-bold in highlighted box (p-4 rounded-lg)
- Action buttons: 2-column grid (Accept full-width primary, Cancel secondary)

### 4. Driver Dashboard
**Layout**: Dashboard with tabbed navigation
- Top header: Reputation score badge prominent (right side)
- Available Rides: Card list with max-h-screen overflow-y-auto
- Each ride card: Horizontal layout with map thumbnail (w-24 h-24), info middle, button right
- Auto-refresh indicator: Subtle animated icon in header

**Ride Card Pattern:**
- Shadow on hover (hover:shadow-xl transition)
- Compact info grid: 2-row layout for pickup/dropoff
- Customer rating: Star icons inline with text
- Accept button: Compact but clear (px-6 py-2)

### 5. Live Ride Tracking Page
**Layout**: Split-screen design
- Map: 60% width (lg:w-3/5), full height viewport sticky
- Info panel: 40% width (lg:w-2/5), scrollable with stats
- Mobile: Stacked (map h-64, info panel below)

**Stats Panel Structure:**
- Top: Driver/Customer avatar + name (flex items-center gap-4)
- Middle: Large metric cards (distance, ETA, fare) in grid
- Bottom: Full-width action button (Complete Ride / Panic)

**Map Integration:**
- Leaflet container: min-h-96 lg:h-screen
- Custom markers: Driver (pulsing dot animation), Dropoff (pin icon)
- Route polyline: Stroke width 3px

### 6. Rating Popup
**Layout**: Modal overlay (max-w-sm)
- Star rating: Centered, large touch targets (text-4xl, gap-2)
- Comment textarea: h-32 with border
- Submit: Full-width gradient button

## Navigation & Headers

**Global Header Pattern:**
- Height: h-16
- Logo: Left (h-8)
- Wallet info: Right (flex items-center gap-4)
- Balance display: Monospace font for numbers
- Divider: Border-b on header

## Form Elements

**Input Fields:**
- Height: h-12
- Padding: px-4
- Border: 2px solid with rounded-lg
- Focus state: Ring treatment (ring-2)

**Buttons:**
- Primary CTA: h-14 px-8 rounded-xl font-semibold
- Secondary: h-12 px-6 rounded-lg
- Icon buttons: w-10 h-10 rounded-full

## Card System

**Standard Card:**
- Padding: p-6
- Border radius: rounded-xl
- Shadow: shadow-md, hover:shadow-lg
- Border: 1px solid for subtle definition

**Elevated Card (Active states):**
- Padding: p-8
- Shadow: shadow-xl
- Border: 2px solid

## Icons

**Library**: Heroicons (via CDN)
- Navigation: 24px outline icons
- Inline status: 16px solid icons
- Feature highlights: 32px outline icons

## Responsive Breakpoints

- Mobile-first approach
- sm (640px): 2-column grids
- md (768px): Dashboard layouts activate
- lg (1024px): Full split-screen tracking view

## Images

**Hero/Welcome Section** (Auth Page):
- Abstract gradient mesh background (full viewport)
- Semi-transparent overlay for text readability
- No photographic imagery - rely on Polkadot-inspired gradient aesthetic

**Dashboard Sections:**
- Map components use Leaflet.js tiles (no custom images)
- Avatar placeholders for drivers/customers (geometric shapes or initials)
- No decorative imagery - focus on functional data visualization

**Icons over gradients:**
- Buttons on gradient backgrounds: backdrop-blur-md bg-white/10 treatment
- No hover state modifications for blurred buttons

## Animation Guidelines

**Minimal, Purposeful Motion:**
- Page transitions: None (instant)
- Card hover: Shadow elevation only (transition-shadow duration-200)
- Loading states: Simple spinner (animate-spin)
- Driver location: Smooth map pan (Leaflet native)
- Success states: Subtle scale bounce (scale-105)

**Explicitly Avoid:**
- Scroll-triggered animations
- Complex entrance effects
- Parallax on dashboards