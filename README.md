# Speakeasy: Fullstack Chat & Video Calling Platform

## 📚 Project Overview
Speakeasy is a fullstack real-time chat and video calling platform designed for language exchange and social connection. It features:

- 🌐 Real-time messaging with typing indicators & reactions
- 📹 1-on-1 and group video calls with screen sharing & recording
- 🔐 Secure JWT authentication & protected routes
- 🌍 Language exchange with user profiles and friend system
- 🎨 32 unique UI themes (customizable)
- ⚡ Modern tech stack: React, Express, MongoDB, TailwindCSS, TanStack Query
- 🧠 Global state management with Zustand
- 🚨 Robust error handling (frontend & backend)
- 🚀 Ready for free deployment


---

🧪 **Environment Variables**

For local development, create these files:

**Backend (`/backend/.env`)**
```env
PORT=443
MONGO_URI=your_mongo_uri
STEAM_API_KEY=your_stream_api_key
STEAM_API_SECRET=your_stream_api_secret
JWT_SECRET_KEY=your_jwt_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend (`/frontend/.env`)**
```env
VITE_API_URL=http://localhost:443/api
VITE_STREAM_API_KEY=your_stream_api_key
```

**Render deployment variables**
Use these exact values in Render for the backend service:
```env
PORT=10000
MONGO_URI=your_mongo_uri
STEAM_API_KEY=your_stream_api_key
STEAM_API_SECRET=your_stream_api_secret
JWT_SECRET_KEY=your_jwt_secret
NODE_ENV=production
FRONTEND_URL=https://your-frontend-render-url.onrender.com
```

Use these in the frontend service:
```env
VITE_API_URL=https://your-backend-render-url.onrender.com/api
VITE_STREAM_API_KEY=your_stream_api_key
```

---

🔧 **Run the Backend**
```bash
cd backend
npm install
npm run dev
```

💻 **Run the Frontend**
```bash
cd frontend
npm install
npm run dev
```

---



## 🗂️ Directory Structure

```
chat-and-video-calls-platform/
├── backend/                # Express.js backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers (auth, chat, user)
│   │   ├── lib/            # DB and stream utilities
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # Mongoose models (User, FriendRequest)
│   │   ├── routes/         # API route definitions
│   │   └── server.js       # App entry point
│   ├── package.json
│   └── ...
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── constants/      # App constants
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # API/axios/utils
│   │   ├── pages/          # App pages (Home, Friends, Chat, etc.)
│   │   ├── store/          # Zustand stores
│   │   └── ...
│   ├── public/             # Static assets
│   ├── index.html
│   ├── package.json
│   └── ...
├── README.md               # Project documentation
└── ...
```

---

## 📡 API Endpoints (Backend)

Base URL: `http://localhost:5001/api`

- **Auth**
  - `POST /api/auth/signup` — Register new user
  - `POST /api/auth/login` — Login
  - `GET /api/auth/me` — Get current user
- **User & Friends**
  - `GET /api/users/friends` — Get my friends
  - `POST /api/users/friend-request/:id` — Send friend request
  - `PUT /api/users/friend-request/:id/accept` — Accept friend request
  - `GET /api/users/friend-requests` — Get incoming/accepted requests
  - `GET /api/users/outgoing-friend-requests` — Get outgoing requests
  - `GET /api/users/recommended` — Get recommended users
- **Chat**
  - `GET /api/chat/token` — Get chat/video token

> All protected routes require authentication (JWT in cookies).

---

## 🧑‍💻 Contact

**Name:** JEEVAN RUSHI SUDULA  
**Email:** jeevanrushicreations584@gmail.com

Feel free to reach out for any queries, suggestions, or contributions!
