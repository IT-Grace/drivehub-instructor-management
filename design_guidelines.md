# Design Guidelines: Driving Instructor Management Platform

## Design Approach
**Selected System**: Modern SaaS Design (inspired by Linear, Notion, Asana)
**Justification**: Utility-focused management application requiring clarity, efficiency, and professional aesthetics. The design prioritizes information hierarchy, quick task completion, and role-based workflows.

**Key Principles**:
- Clean, distraction-free interfaces for focused work
- Consistent patterns across all user roles
- Information density balanced with breathing room
- Professional, trustworthy appearance

## Core Design Elements

### A. Color Palette

**Light Mode**:
- Background: 0 0% 100% (pure white)
- Surface: 240 5% 96% (light gray cards/panels)
- Border: 240 6% 90%
- Text Primary: 240 10% 10%
- Text Secondary: 240 5% 45%
- Primary Brand: 210 85% 55% (professional blue)
- Success: 145 65% 45% (lesson completed)
- Warning: 35 90% 55% (pending payments)
- Danger: 0 75% 55% (cancellations)

**Dark Mode**:
- Background: 240 10% 8%
- Surface: 240 8% 12%
- Border: 240 6% 20%
- Text Primary: 240 5% 95%
- Text Secondary: 240 5% 65%
- Primary Brand: 210 85% 60%
- Success: 145 60% 50%
- Warning: 35 85% 60%
- Danger: 0 70% 60%

### B. Typography

**Font Families**:
- Primary: Inter (via Google Fonts) -UI, body text, data
- Monospace: JetBrains Mono - time displays, IDs, codes

**Scale**:
- Hero/Page Titles: text-3xl font-bold (30px)
- Section Headers: text-xl font-semibold (20px)
- Card Titles: text-base font-medium (16px)
- Body Text: text-sm (14px)
- Labels/Metadata: text-xs font-medium uppercase tracking-wide (12px)

### C. Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 8, 12, 16
- Tight spacing (component internals): p-2, gap-2
- Standard spacing (cards, sections): p-4, gap-4, m-4
- Generous spacing (page sections): p-8, gap-8, mb-12
- Major divisions: py-16

**Grid Structure**:
- Dashboard layouts: 3-column grid on desktop (sidebar + main + details panel)
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Data tables: Full-width with sticky headers

### D. Component Library

**Navigation**:
- Top bar: Fixed header with logo, role indicator, notifications, profile (h-16)
- Side navigation: Collapsible sidebar (w-64) with icon-based compact mode (w-16)
- Role-specific navigation items with clear active states
- Breadcrumbs for nested pages

**Dashboards**:
- Stat cards: 3-4 metrics in grid layout with icons, numbers, trend indicators
- Quick actions: Prominent CTAs for primary tasks (Schedule Lesson, Add Student)
- Activity feed: Timeline-style recent activities with timestamps
- Calendar widget: Weekly/monthly view with color-coded lesson types

**Data Display**:
- Tables: Striped rows, sortable headers, action columns, row selection
- Student cards: Avatar, name, progress bar, next lesson, quick actions
- Lesson cards: Date/time, student name, status badge, location, notes preview
- Payment cards: Amount, status, method, date, invoice link

**Forms**:
- Single-column layouts for focus (max-w-2xl)
- Grouped fields with clear labels and helper text
- Date/time pickers for scheduling
- Multi-select for assigning instructors/students
- Inline validation with success/error states
- Form sections with dividers for complex forms

**Calendar/Scheduling**:
- Week view as primary interface (7-column grid)
- Time slots in 30-minute increments
- Drag-and-drop lesson rescheduling
- Color-coded by lesson status (scheduled, completed, cancelled)
- Instructor availability overlay
- Conflict detection with visual warnings

**Modals & Overlays**:
- Slide-over panels for quick edits (right side, w-1/3)
- Centered modals for important actions (max-w-lg)
- Toast notifications for feedback (top-right corner)
- Confirmation dialogs for destructive actions

**Status Indicators**:
- Lesson status: Pill-shaped badges (scheduled=blue, completed=green, cancelled=red, pending=yellow)
- Payment status: Outlined badges (paid=green, pending=yellow, overdue=red)
- User role badges: Subtle background colors with contrasting text

### E. Animations

**Minimal, purposeful animations**:
- Page transitions: 150ms fade-in
- Dropdown/modal entrance: 200ms slide-up with fade
- Hover states: 100ms color transitions
- Loading states: Skeleton screens, no spinners
- No scroll-triggered animations
- No decorative movements

## Role-Specific Design Considerations

**Student Dashboard**:
- Emphasis on upcoming lessons and progress tracking
- Large, clear CTAs for booking lessons and making payments
- Visual progress indicators (lessons completed, hours driven)
- Simple, encouraging design language

**Instructor Dashboard**:
- Dense information view with today's schedule prominent
- Quick access to student profiles and notes
- Batch actions for lesson management
- Revenue/earnings tracking section

**Super Admin**:
- System-wide metrics and analytics
- User management tables with bulk actions
- Reporting interfaces with data visualization
- System settings and configuration panels

## Images

**Profile Avatars**: Circular avatars for all users (default to initials with colored backgrounds when no photo)
**Instructor Photos**: Optional rectangular cards on public-facing instructor listing (if implemented)
**No Hero Images**: This is a utility application - skip marketing-style hero sections
**Dashboard Icons**: Use Heroicons throughout for consistency (calendar, user-group, currency-dollar, clock, check-circle)

## Accessibility & Polish

- Consistent dark mode across all inputs, forms, tables
- ARIA labels on all interactive elements
- Keyboard navigation support for all primary workflows
- Focus indicators on all interactive elements (ring-2 ring-primary)
- Proper contrast ratios maintained in both themes
- Loading states for all async operations
- Empty states with helpful guidance
- Error states with recovery suggestions