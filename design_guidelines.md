# 10 on 10 App - Design Guidelines

## Design Approach

**Visual Language**: Match the native 10 on 10 mobile app
**Key Principles**:
- Gaming-oriented dark theme with vibrant accent
- Compact, mobile-first layout
- Clean card-based design with subtle borders
- Consistent 8px border radius
- Minimal spacing for information density

---

## Color System

**Primary Palette** (from 10 on 10 mobile app):
- **Accent/Primary**: `#1A8BE1` - Bright blue for buttons, links, and interactive elements
- **Background**: `#171A23` - Dark navy for main surfaces
- **Text Primary**: `#E7E8EA` - Light gray for primary content
- **Text Secondary**: `#9CA3AF` - Muted gray for secondary information
- **Text Tertiary**: `#6B7280` - Subtle gray for least important info

**Surface Colors**:
- **Card Background**: `rgba(231, 232, 234, 0.1)` - Subtle overlay on dark background
- **Border**: `rgba(229, 231, 235, 0.2)` - Minimal contrast borders

**Usage Guidelines**:
- Use accent color (#1A8BE1) ONLY on controls, buttons, badges, and indicators
- Never use accent color for body text (accessibility concern)
- Maintain contrast ratio of at least 4.5:1 for text on backgrounds

---

## Typography System

**Font Families**:
- Primary: Inter (system default) - All UI elements
- Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto

**Hierarchy**:
- Page Titles: 2xl (24px), font-bold
- Section Headers: lg (18px), font-semibold
- Card Titles: base (16px), font-semibold
- Body Text: sm (14px), font-normal
- Meta Text: xs (12px), font-normal

---

## Layout System

**Spacing Primitives** (from 10 on 10):
- Small: 8px (p-2, gap-2)
- Medium: 16px (p-4, gap-4)  
- Large: 24px (p-6, gap-6)

**Page Structure**:
- Main container: max-w-7xl with horizontal padding
- Content padding: 16-24px (compact, mobile-like)
- Card padding: 16px (p-4)
- Gap between cards: 16px (gap-4)

**Responsive Behavior**:
- Mobile: Full-width with 16px side padding
- Tablet: Centered with max-width constraints
- Desktop: Centered, preserving mobile-like proportions

---

## Component Library

### Card Components
- **Border Radius**: 8px (rounded-md)
- **Border**: 1px solid with rgba(229, 231, 235, 0.2)
- **Background**: rgba(231, 232, 234, 0.1) over dark surface
- **Padding**: 16px (p-4)
- **Hover**: Subtle elevation using hover-elevate class

### Home Tab - Tournament Grid
- Compact 2-column grid
- Tournament cards: Image + title overlay
- Participant count badge (right)
- 8px border radius, subtle hover effect

### Discovery Tab - Server List
- Full-width server cards
- Layout: Icon (circular, left) | Name + Members (center) | Join button (right)
- Compact 16px padding
- Border bottom dividers between items

### Messages Tab - Chat Threads
- List of message cards
- Layout: Avatar (left) | Name + preview (center) | Time + badge (right)
- Unread count: Primary color badge
- Relative timestamps ("5 minutes ago")

### Notifications Tab - Alerts Feed
- Chronological notification list
- Layout: Type icon (left) | Title + message (center) | Timestamp (right)
- Unread items: Subtle background highlight (bg-accent/50)
- Colored icon backgrounds by type

### My Servers Tab - Overview Cards
- Grid of server feature cards
- Stats display: Matches, Teams, Tournaments
- Placeholder state with helpful text

### Account Tab - Profile
- Profile header: Avatar + username + stats
- Stats row: Tournaments | Wins | Teams
- Clean, centered layout

---

## Icons
**Library**: Lucide React
- Use outline style for consistency
- Size: 20px (h-5 w-5) for list items
- Size: 16px (h-4 w-4) for inline icons

---

## Animations
**Minimal, Strategic**:
- Hover states: Use hover-elevate utility class
- Active states: Use active-elevate-2 utility class
- No excessive motion or page load animations
- Smooth transitions (300ms) for state changes

---

## Accessibility
- Maintain 4.5:1 contrast ratio for all text
- Use accent color only on interactive elements
- Provide clear focus indicators
- Support keyboard navigation
- Include data-testid on all interactive elements
