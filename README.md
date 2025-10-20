# DriveWise - Driving Instructor Management Platform

<div align="center">
  <h3>🚗 Professional Driving School Management System</h3>
  <p>A comprehensive SaaS platform for driving instructors to manage students, schedule lessons, and track progress</p>
  
  ![License](https://img.shields.io/badge/license-MIT-blue.svg)
  ![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)
  ![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen.svg)
</div>

## 🌟 Features

### 👨‍🎓 **Student Management**

- Complete student profiles with progress tracking
- License information and contact details
- Hours completed vs. total hours visualization
- Assignment to instructors
- Notes and progress tracking

### 👨‍🏫 **Instructor Dashboard**

- Comprehensive instructor profiles and settings
- Student roster management
- Lesson scheduling with calendar integration
- Earnings tracking and reporting
- Specializations and bio management

### 📅 **Lesson Management**

- Interactive lesson scheduling with date/time picker
- Multiple lesson types (standard, highway, parking, test prep)
- Status tracking (scheduled, completed, cancelled, pending)
- Duration and location management
- Timezone-aware scheduling

### 💰 **Payment System**

- Payment tracking per student
- Lesson-based and package payment options
- Payment status monitoring (pending, paid, overdue)
- Due date management
- Payment method tracking

### 🔐 **Role-Based Access Control**

- **Students**: View lessons, progress, and payments
- **Instructors**: Manage assigned students and lessons
- **Super Admins**: Full system oversight and user management
- Secure authentication with Replit Auth integration

### 📊 **Analytics & Reporting**

- System-wide statistics dashboard
- User growth and lesson completion metrics
- Revenue tracking and pending payments
- Recent activity monitoring

## 🏗️ Architecture

### **Full-Stack TypeScript Application**

- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: TanStack Query
- **Routing**: Wouter (lightweight React router)

### **Monorepo Structure**

```
├── client/           # React frontend application
├── server/           # Express backend API
├── shared/           # Shared TypeScript types and schemas
├── dist/             # Built application
└── docker/           # Docker configuration files
```

### **Database Schema**

- **Users**: Authentication and role management
- **Students**: Student profiles and instructor assignments
- **Instructors**: Instructor profiles and specializations
- **Lessons**: Lesson scheduling and tracking
- **Payments**: Payment management and tracking
- **Sessions**: Secure session storage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/IT-Grace/drivehub-instructor-management.git
   cd drivehub-instructor-management
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file:

   ```env
   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/drivehub

   # Session Security (generate with: npm run generate-secret)
   SESSION_SECRET=your_secure_session_secret_here

   # Replit Auth Configuration
   REPL_ID=your-repl-id
   REPLIT_DOMAINS=your-domain.com
   ISSUER_URL=https://replit.com/oidc
   ```

4. **Database Setup**

   ```bash
   # Push schema to database
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 🐳 Docker Deployment

### Development with Docker

1. **Build the image**

   ```bash
   docker build -t drivewise-app .
   ```

2. **Run with development configuration**
   ```bash
   docker run -d --name drivewise-dev \
     -p 5000:5000 \
     -e NODE_ENV=development \
     -e DATABASE_URL=your_database_url \
     -e SESSION_SECRET=your_session_secret \
     -e REPL_ID=local-dev \
     -e REPLIT_DOMAINS=localhost \
     drivewise-app
   ```

### Production Deployment

Use the provided docker-compose files:

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Development deployment
docker-compose up -d
```

## 🧪 Development Mode Features

### Mock Authentication

In development mode, the application provides three test users:

- **Admin User**: `admin@example.com` (Super Admin)
- **John Instructor**: `instructor@example.com` (Instructor)
- **Jane Student**: `student@example.com` (Student)

Access the mock login at: `http://localhost:5000/api/login`

### Hot Reloading

- Frontend: Vite HMR for instant updates
- Backend: tsx with file watching
- Database: Live schema updates with Drizzle Kit

## 📁 Project Structure

```
DriveWise/
├── client/                    # Frontend React Application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/           # Shadcn/ui base components
│   │   │   └── app-sidebar.tsx
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility libraries
│   │   └── pages/            # Application pages/routes
│   └── index.html
├── server/                    # Backend Express Application
│   ├── db.ts                 # Database connection
│   ├── routes.ts             # API route definitions
│   ├── storage.ts            # Database operations
│   ├── replitAuth.ts         # Authentication logic
│   ├── vite.ts               # Development server setup
│   └── index.ts              # Main server entry point
├── shared/                    # Shared TypeScript definitions
│   └── schema.ts             # Database schema & types
├── .github/                  # GitHub workflows and templates
├── docker-compose.yml        # Development Docker setup
├── docker-compose.prod.yml   # Production Docker setup
├── Dockerfile               # Production Docker image
├── design_guidelines.md     # UI/UX design specifications
└── DOCKER.md               # Docker deployment guide
```

## 🎨 Design System

The application follows modern SaaS design principles:

- **Clean Interface**: Distraction-free design for focused work
- **Professional Aesthetics**: Trust-building visual design
- **Consistent Patterns**: Unified experience across all roles
- **Information Hierarchy**: Clear content prioritization
- **Responsive Design**: Works on desktop, tablet, and mobile

### Color Palette

- **Primary**: Professional blue for actions and branding
- **Success**: Green for completed lessons and positive actions
- **Warning**: Yellow/orange for pending items and alerts
- **Danger**: Red for cancellations and critical actions

### Typography

- **Headings**: Inter font family, weighted hierarchy
- **Body**: Optimized for readability and scanning
- **Code/Data**: JetBrains Mono for data consistency

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build production application
- `npm start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes
- `npm run generate-secret` - Generate secure session secret

## 🚨 Environment Configuration

### Required Environment Variables

| Variable         | Description                   | Example                                    |
| ---------------- | ----------------------------- | ------------------------------------------ |
| `DATABASE_URL`   | PostgreSQL connection string  | `postgresql://user:pass@localhost:5432/db` |
| `SESSION_SECRET` | Secure session encryption key | Generate with `npm run generate-secret`    |
| `REPL_ID`        | Replit project identifier     | `your-repl-id`                             |
| `REPLIT_DOMAINS` | Authorized domains for OAuth  | `yourdomain.com,localhost`                 |
| `ISSUER_URL`     | OIDC issuer URL               | `https://replit.com/oidc`                  |
| `NODE_ENV`       | Application environment       | `development` or `production`              |

### Security Configuration

The application automatically generates secure session secrets if not provided, but for production deployments, always set a persistent `SESSION_SECRET`:

```bash
npm run generate-secret
```

## 📊 Database Management

### Schema Migrations

The application uses Drizzle ORM with schema-first development:

```bash
# Push schema changes to database
npm run db:push

# Generate migration files (if needed)
npx drizzle-kit generate
```

### Database Setup

1. Create PostgreSQL database
2. Configure `DATABASE_URL` in `.env`
3. Run `npm run db:push` to create tables
4. Application will auto-populate test data in development mode

## 🔒 Security Features

- **Authentication**: Secure OpenID Connect integration
- **Session Management**: Server-side session storage in PostgreSQL
- **Role-Based Access**: Granular permission system
- **CSRF Protection**: Built-in request validation
- **Environment Security**: Secure secret management
- **Docker Security**: Non-root user execution

## 🌐 API Documentation

### Authentication Endpoints

- `GET /api/login` - Initiate authentication flow
- `GET /api/logout` - End user session
- `GET /api/auth/user` - Get current user info

### Student Endpoints

- `GET /api/student/profile` - Student profile and progress
- `GET /api/student/lessons/upcoming` - Upcoming lessons
- `GET /api/student/payments/recent` - Recent payments

### Instructor Endpoints

- `GET /api/instructor/students` - Assigned students
- `PATCH /api/instructor/students/:id` - Update student info
- `GET /api/instructor/lessons` - Instructor's lessons
- `GET /api/instructor/earnings` - Earnings summary

### Admin Endpoints

- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - All users
- `POST /api/admin/users` - Create new user
- `PATCH /api/admin/users/:id` - Update user

### Shared Endpoints

- `GET /api/health` - Application health check
- `POST /api/lessons` - Create new lesson
- `PATCH /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use Prettier for code formatting
- Write descriptive commit messages
- Update documentation for new features
- Test both development and production builds

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shadcn/ui** for the excellent component library
- **Drizzle ORM** for type-safe database operations
- **TanStack Query** for powerful data fetching
- **Replit** for authentication infrastructure
- **Tailwind CSS** for utility-first styling

---

<div align="center">
  <p>Built with ❤️ for driving instructors and students</p>
  <p>
    <a href="#top">⬆️ Back to Top</a>
  </p>
</div>
