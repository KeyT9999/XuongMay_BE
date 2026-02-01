# Xuong May Backend API

Backend API cho hệ thống Quản Lý Xưởng May ERP.

## Tech Stack

- NestJS
- TypeScript
- MongoDB (Mongoose)
- JWT Authentication
- bcrypt for password hashing

## Prerequisites

- Node.js (v18+)
- MongoDB (running on localhost:27017 or update MONGODB_URI in .env)

## Installation

```bash
npm install
```

## Environment Setup

1. Copy `.env.example` to `.env` (hoặc tạo file `.env` với nội dung sau):

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/xuongmay
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
```

2. Đảm bảo MongoDB đang chạy

## Running the app

```bash
# development
npm run start:dev

# production mode
npm run build
npm run start:prod
```

## Seed Data

Tạo default users cho testing:

```bash
npm run seed
```

**Default users:**
- Admin: `admin` / `admin123`
- Tech: `tech` / `tech123`
- Accountant: `accountant` / `acc123`
- Planner: `planner` / `plan123`
- Warehouse: `warehouse` / `wh123`
- HR: `hr` / `hr123`
- Factory Manager: `factory` / `factory123`

## API Endpoints

### Auth
- `POST /auth/login` - Login
  - Body: `{ username: string, password: string }`
  - Response: `{ accessToken: string, user: UserDto }`
- `GET /auth/me` - Get current user (protected, requires JWT token)

### Users (All require JWT authentication)
- `GET /users` - List users (admin only)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user (admin only)
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Soft delete user (admin only)

## Testing with Postman/Thunder Client

1. **Login:**
   ```
   POST http://localhost:3000/auth/login
   Content-Type: application/json
   
   {
     "username": "admin",
     "password": "admin123"
   }
   ```

2. **Get Current User:**
   ```
   GET http://localhost:3000/auth/me
   Authorization: Bearer <accessToken>
   ```

3. **List Users (Admin only):**
   ```
   GET http://localhost:3000/users
   Authorization: Bearer <accessToken>
   ```

## Project Structure

```
src/
├── auth/           # Authentication module
├── users/         # User management module
├── common/        # Shared utilities (filters, decorators)
├── config/        # Configuration
├── scripts/       # Seed scripts
└── main.ts        # Application entry point
```
