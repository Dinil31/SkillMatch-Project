# SkillMatch.lk 🇱🇰

A full-stack freelance marketplace platform connecting skilled workers with customers in Sri Lanka.

## 🚀 Tech Stack

### Backend
- **Node.js** + **Express.js** — REST API server
- **MongoDB** + **Mongoose** — Database & ODM
- **Socket.IO** — Real-time messaging
- **JWT** — Authentication
- **Cloudinary** — Image/file storage
- **Nodemailer** — Email notifications
- **Bcrypt** — Password hashing

### Frontend
- **Next.js 15** (App Router) — React framework
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling
- **Framer Motion** — Animations
- **Zustand** — State management
- **React Hook Form** + **Zod** — Form validation
- **Socket.IO Client** — Real-time chat
- **Axios** — HTTP client

---

## 📁 Project Structure

```
skillmatch.lk/
├── server/                  # Backend API
│   ├── config/              # DB & Cloudinary config
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Auth, error, upload middleware
│   ├── models/              # Mongoose models
│   ├── routes/              # Express routers
│   ├── services/            # Business logic services
│   ├── sockets/             # Socket.IO handlers
│   ├── utils/               # Helper utilities
│   └── server.js            # Entry point
│
├── client/                  # Frontend Next.js app
│   ├── app/                 # Next.js App Router pages
│   │   ├── (auth)/          # Auth pages (login, register)
│   │   ├── workers/         # Worker browse & profiles
│   │   ├── gigs/            # Gig browse & details
│   │   ├── dashboard/       # Role-based dashboards
│   │   └── messages/        # Real-time chat
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Base UI components
│   │   ├── layout/          # Layout components
│   │   ├── workers/         # Worker-specific components
│   │   ├── gigs/            # Gig-specific components
│   │   ├── chat/            # Chat components
│   │   └── reviews/         # Review components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API service functions
│   ├── store/               # Zustand state stores
│   ├── types/               # TypeScript interfaces
│   └── lib/                 # Utilities & validations
│
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js >= 18.x
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Gmail account (for email notifications)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/skillmatch.lk.git
cd skillmatch.lk
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
cp .env.local.example .env.local
# Edit .env.local with your API URL
npm run dev
```

### 4. Access the app
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Send reset email |
| PUT | `/api/auth/reset-password/:token` | Reset password |
| GET | `/api/auth/verify-email/:token` | Verify email |

### Workers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workers` | Get all workers (with filters) |
| GET | `/api/workers/:id` | Get worker by ID |
| POST | `/api/workers/profile` | Create worker profile |
| PUT | `/api/workers/profile` | Update worker profile |
| DELETE | `/api/workers/profile` | Delete worker profile |

### Gigs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gigs` | Get all gigs |
| GET | `/api/gigs/:id` | Get gig by ID |
| POST | `/api/gigs` | Create gig (worker only) |
| PUT | `/api/gigs/:id` | Update gig |
| DELETE | `/api/gigs/:id` | Delete gig |
| GET | `/api/gigs/worker/my-gigs` | Get worker's own gigs |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs` | Create job (customer only) |
| GET | `/api/jobs` | Get all jobs |
| GET | `/api/jobs/:id` | Get job by ID |
| PUT | `/api/jobs/:id/status` | Update job status |
| GET | `/api/jobs/customer/my-jobs` | Get customer's jobs |
| GET | `/api/jobs/worker/my-jobs` | Get worker's jobs |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Create review |
| GET | `/api/reviews/worker/:workerId` | Get worker reviews |
| DELETE | `/api/reviews/:id` | Delete review |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages` | Send message |
| GET | `/api/messages/:conversationId` | Get conversation |
| GET | `/api/messages/conversations` | Get all conversations |
| PUT | `/api/messages/:id/read` | Mark as read |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Get all users |
| PUT | `/api/admin/users/:id/ban` | Ban user |
| PUT | `/api/admin/workers/:id/verify` | Verify worker |
| GET | `/api/admin/reports` | Get reports |
| GET | `/api/admin/stats` | Dashboard stats |

---

## 🔐 User Roles

- **Customer** — Browse workers, post jobs, leave reviews
- **Worker** — Create gigs, accept jobs, manage profile
- **Admin** — Platform management, user moderation

---

## 🌐 Real-time Features

Socket.IO events:
- `join_room` — Join a conversation room
- `send_message` — Send a chat message
- `receive_message` — Receive a chat message
- `typing` — Typing indicator
- `online_users` — Track online users

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with ❤️ for Sri Lanka 🇱🇰
