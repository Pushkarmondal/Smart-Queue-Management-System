# Smart Queue Management System

A modern queue management system that allows users to join virtual queues and get real-time updates on their position.

## Features

- 🔐 **User Authentication**
  - JWT-based authentication
  - Role-based access control (User/Admin)

- 🚦 **Queue Management**
  - Create and manage multiple queues
  - Join/leave queues
  - Real-time position tracking

- 🎫 **Ticket System**
  - Unique ticket generation
  - Live position updates
  - Status tracking (waiting, serving, served)

- 👨‍💼 **Admin Dashboard**
  - Monitor queue status
  - Manage users and queues
  - Analytics and reporting

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login

### Queues
- `GET /queues` - List all available queues
- `POST /queues` - Create a new queue (Admin only)
- `GET /queues/:id` - Get queue details
- `POST /queues/:id/join` - Join a queue
- `DELETE /queues/:id/leave` - Leave a queue

### Tickets
- `GET /tickets/:id` - Get ticket status
- `GET /users/me/tickets` - Get user's active tickets

### Admin
- `POST /admin/queues/:id/mark-done` - Mark current ticket as done
- `GET /admin/queues/:id/next` - Move to next in queue

## Real-time Updates

- WebSocket endpoint: `/ws`
- Events:
  - `position_update`: When user's position changes
  - `ticket_called`: When a ticket is being served
  - `queue_status`: General queue status updates

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (for WebSocket sessions)

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database
4. Create `.env` file with your database credentials:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/queue_db?schema=public"
   JWT_SECRET=your_jwt_secret
   REDIS_URL=your_redis_url
   PORT=3002
   NODE_ENV=development
   ```
5. Run database migrations: `npx prisma migrate dev`
6. Start the server: `npm run dev`

## Database Schema

We use Prisma ORM with PostgreSQL. The main models include:

- `User` - System users and authentication
- `Queue` - Queue instances
- `Ticket` - User tickets in queues
- `Admin` - Administrative users

Run `npx prisma studio` to explore the database with a visual interface.
