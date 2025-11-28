# Car & Bike Parking Rental System

A Node.js + Express + MongoDB backend for managing car and bike parking spot rentals with booking, payments, and OTP verification.

## Quick Start

```bash
npm install
cp .env.example .env   # or create manually
npm run dev            # http://localhost:5001
```

Minimum `.env`:
```env
MONGO_URI=mongodb://127.0.0.1:27017/parking_system
JWT_SECRET=change_me
OTP_EXPIRE_SECONDS=300
PORT=5001
```

## How It’s Structured
- **Routes → Controllers → Services** pattern keeps logic isolated and testable.
- **Middleware** (`authMiddleware`) injects the authenticated user via JWT.
- **Utilities**: `asyncHandler` catches controller errors, `httpError` standardizes thrown errors, `response` keeps JSON output consistent.

```
src/
  config/        # env + Mongo connection
  controllers/   # translate HTTP ↔ service calls
  services/      # business logic & DB access
  middleware/    # auth + error handling glue
  model/         # Mongoose schemas
  routes/        # API endpoints
  utils/         # helpers (jwt, otp, errors, etc.)
server.js        # express bootstrap
```

## Key Endpoints
- `POST /auth/register`, `POST /auth/login`
- `POST /otp/send`, `POST /otp/verify`
- `POST /parking/add`, `GET /parking/my-spots`, `GET /parking/search`
- `POST /booking/start`, `PUT /booking/end/:bookingId`, `GET /booking/history?mobile=...`
- `POST /payment/mark-paid`

All protected routes expect `Authorization: Bearer <token>`.

## Notes & Tips
- JWTs expire in 7 days (see `utils/jwt.js`).
- OTPs are logged to the console until an SMS provider is wired in.
- If port 5001 is busy, change `PORT` in `.env`.

## Roadmap
- Swagger/OpenAPI docs
- SMS provider integration
- Automated tests & deployment scripts
