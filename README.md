# Invoice Generator App

A full-stack invoice management application built with Node.js, Express, PostgreSQL, Next.js, and Tailwind CSS.

## Features

- **User Authentication** - Multi-user support with JWT authentication
- **Client Management** - CRUD operations for client contacts
- **Invoice Management** - Create, edit, and track invoices
- **PDF Generation** - Download professional PDF invoices
- **Email Integration** - Send invoices and payment reminders via email
- **Dashboard Analytics** - Revenue charts, stats, and overdue tracking
- **Recurring Invoices** - Set up automatic recurring billing

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + bcrypt
- **PDF**: PDFKit
- **Email**: Nodemailer

## Project Structure

```
invoice-app/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # API client, utilities
│   │   └── hooks/         # Custom React hooks
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth middleware
│   │   ├── services/      # PDF, email services
│   │   └── config/        # Configuration
│   ├── prisma/            # Database schema
│   └── package.json
└── package.json            # Root workspace
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Getting Started

### 1. Clone and Install

```bash
cd invoice-app
npm install
```

### 2. Setup Environment Variables

Copy the example env file and configure:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/invoice_db"
JWT_SECRET="your-secret-key"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 3. Setup Database

```bash
# Create database
createdb invoice_db

# Generate Prisma client and run migrations
cd server
npx prisma generate
npx prisma db push
```

### 4. Run Development Servers

```bash
# From root directory - runs both client and server
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend (http://localhost:5000)
npm run dev:server

# Terminal 2 - Frontend (http://localhost:3000)
npm run dev:client
```

### 5. Access the App

- Frontend: http://localhost:3000
- API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Clients
- `GET /api/clients` - List clients
- `GET /api/clients/:id` - Get client
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Invoices
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id` - Get invoice
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `PATCH /api/invoices/:id/status` - Update status
- `GET /api/invoices/:id/pdf` - Download PDF
- `POST /api/invoices/:id/send` - Send via email
- `POST /api/invoices/:id/remind` - Send reminder

### Dashboard
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/chart` - Get chart data
- `GET /api/dashboard/recent` - Recent invoices
- `GET /api/dashboard/overdue` - Overdue invoices

## Email Setup (Gmail)

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: Google Account → Security → App passwords
3. Use that password in `SMTP_PASS`

## License

MIT
