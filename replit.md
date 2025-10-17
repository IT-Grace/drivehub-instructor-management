# DriveHub - Driving Instructor Management Platform

## Overview

DriveHub is a modern SaaS platform designed for managing driving instruction businesses. The application facilitates scheduling lessons, tracking student progress, managing payments, and coordinating between students, instructors, and administrators. Built with a clean, professional design inspired by modern productivity tools like Linear and Notion, the platform prioritizes clarity, efficiency, and role-based workflows.

The system supports three distinct user roles:
- **Students**: Book and track driving lessons, view progress, manage payments
- **Instructors**: Manage student schedules, track lesson completion, view earnings
- **Super Admins**: Oversee entire platform operations, user management, analytics

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite

**Design System:**
- Custom theme system supporting light/dark modes
- Color palette optimized for professional SaaS appearance
- Typography: Inter for UI/body text, JetBrains Mono for technical displays
- Consistent spacing, elevation, and interaction patterns
- Component variants for different contexts (buttons, badges, cards)

**Key Architectural Decisions:**
- Component-based architecture with reusable UI primitives
- Context-based theme management with localStorage persistence
- Role-based routing and component rendering
- Centralized query client for API communication with auth error handling
- Path aliases for clean imports (@/, @shared/, @assets/)

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (via Neon serverless)
- **Authentication**: Replit Auth (OpenID Connect)
- **Session Management**: Express-session with PostgreSQL store

**API Design:**
- RESTful API endpoints organized by resource and role
- Role-based middleware for authorization (`requireRole`)
- Authentication middleware (`isAuthenticated`)
- Centralized error handling
- Request/response logging for API routes

**Database Schema Design:**
- **Users Table**: Core identity with role field (student/instructor/super_admin)
- **Students Table**: Extended profile linked to users
- **Instructors Table**: Extended profile linked to users  
- **Lessons Table**: Scheduling and tracking with status workflow
- **Payments Table**: Financial transaction records
- **Sessions Table**: Required for Replit Auth session storage

**Key Architectural Decisions:**
- Monorepo structure with shared schema between client/server
- Type-safe database operations using Drizzle ORM
- Zod schemas for runtime validation derived from database schema
- Session-based authentication with secure cookie configuration
- Separation of storage layer for testability and maintainability

### Authentication & Authorization

**Authentication Flow:**
- Replit Auth integration using OpenID Connect
- Session-based authentication with PostgreSQL session store
- Automatic user creation/update on successful authentication
- 7-day session TTL with secure HTTP-only cookies

**Authorization Strategy:**
- Role-based access control (RBAC) with three roles
- Middleware-enforced route protection
- Client-side role-based rendering
- User profile lookup on each authenticated request

**Security Considerations:**
- Secure session cookies (HTTP-only, secure flag in production)
- CSRF protection via session management
- Environment-based configuration for sensitive data

### Data Layer

**Storage Pattern:**
- Interface-based storage abstraction (`IStorage`)
- Concrete implementation using Drizzle ORM
- Async/await pattern for all database operations
- Drizzle query builder for type-safe SQL generation

**Database Operations:**
- CRUD operations for all entities
- Relationship queries (students by instructor, lessons by date range)
- Aggregation queries for dashboard statistics
- Soft deletes not implemented (hard deletes used)

**Migration Strategy:**
- Drizzle Kit for schema migrations
- Schema defined in TypeScript, migrations generated automatically
- Push-based deployment to sync schema changes

## External Dependencies

### Third-Party Services

**Replit Platform Integration:**
- Replit Auth for authentication (OIDC provider)
- Environment variables for configuration (REPLIT_DOMAINS, REPL_ID)
- Replit-specific Vite plugins for development experience

**Database Service:**
- Neon Serverless PostgreSQL
- WebSocket-based connections for serverless compatibility
- Connection pooling via @neondatabase/serverless

### Key NPM Packages

**UI & Styling:**
- `@radix-ui/*`: Accessible component primitives (20+ packages)
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority`: Component variant management
- `lucide-react`: Icon library

**Data & Forms:**
- `@tanstack/react-query`: Server state management
- `react-hook-form`: Form state and validation
- `@hookform/resolvers`: Form validation integration
- `zod`: Schema validation
- `drizzle-zod`: Derive Zod schemas from Drizzle

**Backend:**
- `express`: Web framework
- `drizzle-orm`: Type-safe ORM
- `passport`: Authentication middleware
- `openid-client`: OIDC authentication
- `connect-pg-simple`: PostgreSQL session store

**Development:**
- `vite`: Build tool and dev server
- `tsx`: TypeScript execution
- `esbuild`: Production bundling
- `drizzle-kit`: Database migrations

### API Integrations

**Internal API Structure:**
- `/api/auth/*`: Authentication endpoints
- `/api/student/*`: Student-specific operations
- `/api/instructor/*`: Instructor-specific operations  
- `/api/admin/*`: Admin-specific operations

**No External APIs:**
- Self-contained application
- All data stored in PostgreSQL
- No third-party service integrations beyond auth/database