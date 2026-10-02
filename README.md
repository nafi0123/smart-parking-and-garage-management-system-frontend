# 🚗 ParkWise – Smart Parking & Garage Management System

A full-stack, sensor-driven smart parking platform to monitor live zone status, manage garages, automate billing, and provide a seamless parking experience.

🌐 **Live Site:** [https://smrat-parking-frontend.vercel.app](https://smrat-parking-frontend.vercel.app)
🔌 **API Base:** [https://smart-parking-backend-omega.vercel.app/api/v1](https://smart-parking-backend-omega.vercel.app/api/v1)

---

## ✨ Features

- 🔐 **Authentication** — Email/Password + Google OAuth (Sign In with Google)
- 🅿️ **Garage Management** — Create, edit, and manage parking garages with live slot tracking
- 📅 **Booking System** — Real-time parking slot reservations with automated pricing
- 💳 **Payment Integration** — Online payment processing for bookings
- ⭐ **Reviews & Ratings** — Driver feedback and garage ratings
- 🚘 **Vehicle Management** — Register and manage multiple vehicles per user
- ❤️ **Favorites** — Save favorite garages for quick access
- 📊 **Analytics Dashboard** — Platform-wide stats and revenue overview
- 👤 **Role-Based Access** — Admin, Manager, and Driver (Customer) roles

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org/) | React framework with SSG & API routes |
| TypeScript | Type-safe development |
| Vanilla CSS | Custom design system & animations |
| Axios | HTTP client with interceptors |
| React Query (TanStack) | Server state management & caching |
| Google Identity Services | OAuth 2.0 login |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| TypeScript | Type-safe backend |
| Prisma ORM | Database access & migrations |
| PostgreSQL | Primary relational database |
| Redis | OTP caching & session storage |
| JWT | Access & refresh token auth |
| Bcrypt | Password hashing |
| Zod | Request validation |

---

## 🚀 Getting Started (Local)

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis instance

### 1. Clone the repository
```bash
git clone https://github.com/your-username/smart-parking-and-garage-management-system.git
cd smart-parking-and-garage-management-system
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env   # Fill in your environment variables
npx prisma migrate dev
npm run dev            # Runs on http://localhost:5000
```

### 3. Setup Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # Fill in your environment variables
npm run dev                         # Runs on http://localhost:3000
```

---

## 🔑 Environment Variables

### Backend (`.env`)
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_ACCESS_SECRET=your_secret
JWT_REFRESH_SECRET=your_secret
JWT_ACCESS_EXPIRES_IN=365d
JWT_REFRESH_EXPIRES_IN=30d
GOOGLE_CLIENT_ID=your_google_client_id
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_BASE_API=http://localhost:5000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 👥 Demo Accounts

| Role | Email | Password |
|---|---|---|
| 🟣 Admin | `nafi.cse0123@gmail.com` | `123456` |
| 🔵 Manager | `nafi.mahmud0123@gmail.com` | `123456` |
| 🟢 Customer | `nafi2122940@gmail.com` | `123456` |

---

## 📁 Project Structure

```
smart-parking-and-garage-management-system/
├── frontend/                  # Next.js application
│   ├── src/
│   │   ├── app/               # Pages & layouts (App Router)
│   │   ├── components/        # Reusable UI components
│   │   ├── services/          # API service layer
│   │   ├── utils/             # Cookie, auth helpers
│   │   └── providers/         # React Query provider
│   └── next.config.ts         # Next.js config with API proxy rewrites
│
└── backend/                   # Express REST API
    └── src/
        ├── module/            # Feature modules (Auth, Garage, Booking...)
        ├── app/               # Middlewares, errors, utilities
        └── app.ts             # Express app setup
```

---

## 📄 License

MIT © 2026 ParkWise
