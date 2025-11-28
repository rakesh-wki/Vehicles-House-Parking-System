# Car & Bike Parking Rental System

A Node.js + Express + MongoDB backend for managing car and bike parking spot rentals with booking, payments, and OTP verification.

## Quick Start

### Prerequisites
- **Node.js** (v16+)
- **npm**
- **MongoDB** (local or cloud URI)

### Setup & Run

#### Linux / macOS / WSL
```bash
bash setup.sh    # Install dependencies
bash start.sh    # Start development server
```

#### Windows PowerShell
```powershell
.\setup.ps1      # Install dependencies
.\start.ps1      # Start development server
```

Server runs on `http://localhost:5000` (default) or the port set in `.env`.

## Configuration
```env
MONGO_URI=mongodb://127.0.0.1:27017/parking_system
JWT_SECRET=your_secret_key_here
OTP_EXPIRE_SECONDS=300
PORT=5000
```

- **MONGO_URI**: MongoDB connection string (local or cloud)
- **JWT_SECRET**: Secret key for JWT token signing
- **OTP_EXPIRE_SECONDS**: OTP validity duration in seconds
- **PORT**: Server port (default: 5000)

## Project Structure

```
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # User auth (register, login)
│   │   ├── bookingController.js  # Booking endpoints
│   │   ├── otpController.js      # OTP send/verify
│   │   ├── parkingController.js  # Parking spot management
│   │   └── paymentController.js  # Payment processing
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT authentication
│   ├── model/
│   │   ├── User.js               # User schema
│   │   ├── Booking.js            # Booking schema
│   │   ├── Otp.js                # OTP schema
│   │   ├── ParkingSpot.js        # Parking spot schema
│   │   └── Transaction.js        # Transaction schema
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── bookingRoutes.js      # Booking endpoints
│   │   ├── otpRoutes.js          # OTP endpoints
│   │   ├── parkingRoutes.js      # Parking endpoints
│   │   └── paymentRoutes.js      # Payment endpoints
│   └── utils/
│       ├── calculatePrice.js     # Price calculation logic
│       └── generateOTP.js        # OTP generation
├── server.js                      # Express server entry point
├── package.json
├── .env                           # Environment variables (create this)
├── setup.sh / setup.ps1           # Setup scripts
└── start.sh / start.ps1           # Start scripts
```

## API Endpoints

### Auth Routes (`/auth`)
- `POST /auth/register` - Register a new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "password": "password123"
  }
  ```
- `POST /auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

### OTP Routes (`/otp`)
- `POST /otp/send` - Send OTP to mobile
  ```json
  {
    "mobile": "9876543210"
  }
  ```
- `POST /otp/verify` - Verify OTP
  ```json
  {
    "mobile": "9876543210",
    "otp": "123456"
  }
  ```

### Parking Routes (`/parking`)
- `POST /parking/create` - Create a new parking spot (requires auth)
- `GET /parking/my-spots` - Get user's parking spots (requires auth)
- `PUT /parking/:id` - Update parking spot
- `PATCH /parking/:id/toggle` - Toggle parking availability
- `POST /parking/search` - Search nearby parking spots
  ```json
  {
    "lat": 28.7041,
    "lng": 77.1025,
    "vehicleType": "car",
    "limit": 20
  }
  ```

### Booking Routes (`/booking`)
- `POST /booking/start` - Start a booking
  ```json
  {
    "mobile": "9876543210",
    "name": "John Doe",
    "vehicleNumber": "ABC123",
    "parkingId": "parking_spot_id"
  }
  ```
- `PATCH /booking/:id/end` - End a booking
- `GET /booking/history/:mobile` - Get user booking history
- `GET /booking/owner-history/:ownerId` - Get owner's booking history

### Payment Routes (`/payment`)
- `POST /payment/mark-paid` - Mark booking as paid
  ```json
  {
    "bookingId": "booking_id"
  }
  ```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/parking_system` | MongoDB connection string |
| `JWT_SECRET` | `change_this_secret` | Secret key for JWT signing |
| `OTP_EXPIRE_SECONDS` | `300` | OTP expiration time (seconds) |
| `PORT` | `5000` | Server port |

## Notes

- JWT tokens expire in 7 days by default
- OTP is logged to console (no SMS provider configured yet)
- Port 5000 must be free; change `PORT` in `.env` if needed

## Troubleshooting

### Port Already in Use
```bash
netstat -aon | findstr ":5000"    # Find process
taskkill /PID <PID> /F            # Kill process
```

### MongoDB Connection Error
Set `MONGO_URI` in `.env` to a valid MongoDB URI (local or cloud)

### Module Not Found
Run `npm install` and verify file paths match `src/model/` (not `src/models/`)

## Future Enhancements

- Add Swagger/OpenAPI documentation
- Implement SMS provider for OTP (Twilio)
- Add unit and integration tests
- Deploy to production (AWS, Heroku)

## License

MIT

## Support

For issues or questions, reach out to the development team.
