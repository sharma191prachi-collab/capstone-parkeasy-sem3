# ParkEasy - Parking Slot Booking (MERN)

## Structure
- backend/   Express + MongoDB + Socket.IO API
- frontend/  React (Vite) app
- postman/   Postman collection (import this)

## 1. Backend
```
cd backend
npm install
copy .env.example .env      (then fill the 2 JWT secrets)
npm run dev
```
Secrets: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` (run twice)
MongoDB must be running (local service, or Atlas string in MONGO_URI).

## 2. Frontend (new terminal)
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## 3. Admin user
Register cannot create admin. In MongoDB Compass set a user's `role` to `admin`.

## 4. Postman
Import postman/ParkEasy.postman_collection.json and run folders in order 1 -> 6.
Tokens and ids are saved automatically by test scripts.
