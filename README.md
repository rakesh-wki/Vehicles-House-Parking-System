# ParkEase — House Parking Rental System

Rent out the empty parking space at your home to vehicle owners nearby.
Vehicle owners find **safe, bookable parking near their location**; house owners earn from idle space.
Billing is automatic — by the hour or by the day.

Two parts:
- **Backend** — Node.js + Express + Mongoose API (port `5001`)
- **Frontend** — React + Vite + Tailwind CSS SPA in `client/` (dev port `5173`), with customer search,
  house-owner dashboard, and admin panel.

## Features

**Discovery & booking (customer)**
- Nearby search with real geo queries (`$near` on a 2dsphere index), filters for vehicle type / radius / price
- Live availability: each spot shows **free slots** computed from running bookings vs. capacity
- Spot detail: photos, amenities, hourly/daily pricing, reviews & ratings
- Book → get a **4-digit check-in OTP** → live parking timer with running bill estimate
- End parking → itemized bill (hours, days, rates) → mock payment → receipt; booking history

**House owner**
- Dashboard: this-month earnings, occupancy %, active parkings
- Add spots with a **click-to-pick map pin**, capacity, vehicle types, pricing, amenities, photo upload
- Approve flow: new spots start as `pending` until an admin approves
- View bookings on your spots, toggle availability

**Admin**
- Dashboard stats, 7-day revenue chart, pending spot approvals, user activation,
  all spots / bookings / transactions views

## Quick start

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017/parking_system`)

### 2. Backend
```bash
cd ~/workspace/vehicles-parking
npm install
cp .env.example .env        # then edit JWT_SECRET
npm run seed                # demo data (see credentials below)
npm run dev                 # http://localhost:5001
```

### 3. Frontend
```bash
cd ~/workspace/vehicles-parking/client
npm install
npm run dev                 # http://localhost:5173
# production build:
npm run build
```

## Demo credentials (created by `npm run seed`)

| Role       | Email             | Password    |
|------------|-------------------|-------------|
| Admin      | admin@park.com    | admin123    |
| HouseOwner | owner1@park.com   | owner123    |
| HouseOwner | owner2@park.com   | owner123    |
| Customer   | customer@park.com | customer123 |

Seed also creates 8 approved spots around Jaipur, completed + running bookings, transactions and reviews.

## API reference

All responses: `{ success: true, data }`. Protected routes need `Authorization: Bearer <token>`.

**Auth** — `POST /auth/register` {name,email,password,mobile,role} · `POST /auth/login` {email,password} →
`{token, user}` · (legacy aliases `/auth/register-house-owner`, `/auth/login-house-owner` kept)

**Parking spots**
- `GET /parking/nearby?lat=&lng=&radiusKm=8&vehicleType=car` — geo search, approved spots, each with `freeSlots` + `avgRating`
- `GET /parking/search` — approved spots, with `freeSlots`
- `GET /parking/:id` — detail with `freeSlots` + `avgRating`
- `GET /parking/:id/availability` → `{capacity, activeBookings, freeSlots}`
- `POST /parking/add` (protect) — accepts `{lat,lng}` or GeoJSON location
- `PUT /parking/:id` / `PUT /parking/update/:id` (protect, owner) · `PUT /parking/toggle/:id` (protect)
- `GET /parking/my-spots` (protect)

**Bookings**
- `POST /booking/start` {parkingId, mobile, name, vehicleNumber} → `{booking, checkinOtp}` (4-digit OTP, 15-min expiry; fails with 400 when no free slots)
- `GET /booking/active` (protect) — my running bookings
- `PUT /booking/end/:bookingId` → `{booking, bill}` where bill = `{hours, days, priceHour, priceDay, totalAmount}`
- `PUT /booking/cancel/:id` (protect) — cancel a running booking (booker or spot owner)
- `GET /booking/history?mobile=` · `GET /booking/owner-history` (protect)

**Reviews** — `POST /reviews` (protect) {spotId, rating 1-5, comment} · `GET /reviews/spot/:spotId`

**Uploads** — `POST /upload/photos` (protect, houseOwner/admin; multipart field `photos`, ≤8 images) →
`{urls: ["/uploads/..."]}`; files served from `/uploads`

**Payments** — `POST /payment/mark-paid` {bookingId}

**Admin** (protect + admin) — `GET /admin/dashboard` (incl. `pendingSpots`) · `GET /admin/users` ·
`PUT /admin/users/:id` {isActive} · `GET /admin/parking` · `PUT /admin/parking/:id/approve` ·
`PUT /admin/parking/:id/reject` · `DELETE /admin/parking/:id` · `GET /admin/bookings` ·
`GET /admin/transactions` · `GET /admin/reports/revenue`

**OTP** — `POST /otp/send` · `POST /otp/verify` (logged to console until an SMS provider is wired in)

## How live availability works

A spot's free slots are **never stored** — they're computed: `capacity − count(bookings with status 'running')`.
Booking start is rejected when full; the legacy `isAvailable` flag is re-synced automatically for backward
compatibility. Spot locations are GeoJSON Points with a `2dsphere` index; legacy `{lat,lng}` data still reads fine.

## Project layout

```
server.js                 # bootstrap
src/
  config/  controllers/  services/  middleware/
  model/   routes/  utils/          # + seed.js
  public/uploads/                  # uploaded photos (served at /uploads)
client/                            # ParkEase SPA
  src/lib/api.js                   # axios + response unwrapping + GeoJSON helpers
  src/context/AuthContext.jsx
  src/components/  src/pages/
```

## Roadmap

- [ ] Swagger/OpenAPI docs
- [ ] SMS provider for OTPs (currently console-logged)
- [ ] Real payment gateway (Razorpay/Stripe) instead of mock payment
- [ ] Owner payout/withdrawal flow
- [ ] Automated tests & Docker compose
- [ ] Push notifications for booking start/end
