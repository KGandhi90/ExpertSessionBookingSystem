# Expert Session Booking System

A full-stack real-time expert session booking application built with **React + Vite** (frontend) and **Node.js + Express + MongoDB** (backend), with live slot updates powered by **Socket.IO**.

---

## Features

| Screen | Features |
|---|---|
| **Expert Listing** | Search by name (debounced), filter by category, pagination, skeleton loading |
| **Expert Detail** | Full profile, time slots grouped by date, real-time slot updates via Socket.IO |
| **Booking Form** | Name / Email / Phone / Date / Time Slot / Notes, client & server validation, success state |
| **My Bookings** | Lookup by email, status badges (Pending → Confirmed → Completed), real-time status updates |

### Critical features

- **Double-booking prevention** — compound unique MongoDB index on `(expertId, date, timeSlot)` + transaction-level slot lock
- **Race condition handling** — MongoDB transactions ensure atomicity between slot-availability check and booking creation
- **Real-time updates** — Socket.IO events (`bookingChanged`, `bookingStatusChanged`) broadcast to all connected clients instantly
- **Forward-only status transitions** — backend enforces Pending → Confirmed → Completed only (no backwards moves)

---

## Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd ExpertSessionBookingSystem
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your `MONGODB_URI`:

```env
MONGODB_URI=mongodb://localhost:27017/expert-booking
PORT=5000
CLIENT_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Seed the database

```bash
node backend/seed.js
```

This inserts 10 sample experts across Technology, Finance, Career, Marketing, Wellness, and Business categories, with availability slots starting from tomorrow.

### 4. Start both servers

```bash
npm run dev:full
```

This runs:
- **Express API** on `http://localhost:5000`
- **Vite dev server** on `http://localhost:5173`

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/experts` | List experts — `?page=1&limit=6&category=&search=` |
| `GET` | `/api/experts/:id` | Get expert by ID with full availability |
| `POST` | `/api/bookings` | Create a booking |
| `GET` | `/api/bookings?email=` | Get bookings by email |
| `PATCH` | `/api/bookings/:id/status` | Update booking status |
| `GET` | `/api/health` | Health check |

---

## Project Structure

```
├── backend/
│   ├── config/          # MongoDB connection
│   ├── controllers/     # Business logic
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   └── seed.js          # Database seeder
├── src/
│   ├── api/             # Axios + Socket.IO client
│   ├── components/      # React screens
│   ├── App.jsx
│   └── App.css
└── server.js            # Express entry point
```

---

## Tech Stack

- **Frontend**: React 19, Vite, React Router v7, Socket.IO client, Axios
- **Backend**: Node.js, Express 5, Socket.IO, Mongoose 8
- **Database**: MongoDB (with transactions for double-booking prevention)
