/* eslint-disable no-console */
// Seed script: wipes the database and creates demo data for local development.
// Usage: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./model/User');
const ParkingSpot = require('./model/ParkingSpot');
const Booking = require('./model/Booking');
const Review = require('./model/Review');
const bookingService = require('./services/bookingService');
const paymentService = require('./services/paymentService');
const calculatePrice = require('./utils/calculatePrice');

const MONGO_URI = process.env.MONGO_URI;

const users = [
  { name: 'Admin', email: 'admin@park.com', mobile: '9000000001', password: 'admin123', role: 'admin' },
  { name: 'Ramesh Sharma', email: 'owner1@park.com', mobile: '9000000002', password: 'owner123', role: 'houseOwner' },
  { name: 'Priya Meena', email: 'owner2@park.com', mobile: '9000000003', password: 'owner123', role: 'houseOwner' },
  { name: 'Amit Verma', email: 'customer@park.com', mobile: '9000000004', password: 'customer123', role: 'customer' },
];

// Jaipur centre: 26.9124, 75.7873 (spread ±0.05)
const spots = [
  {
    title: 'Pink City Secure Parking',
    address: '12, MI Road, Near Ajmeri Gate, Jaipur',
    lat: 26.9124, lng: 75.7873,
    capacity: 6, vehicleTypes: ['car', 'suv'], priceHour: 40, priceDay: 300,
    amenities: ['CCTV', 'Security Guard', 'Covered'], openTime: '06:00', closeTime: '23:00',
    description: 'Secure multi-level parking near the city centre with 24x7 security.',
  },
  {
    title: 'Malviya Nagar Home Parking',
    address: 'B-45, Malviya Nagar, Jaipur',
    lat: 26.8559, lng: 75.8101,
    capacity: 3, vehicleTypes: ['car', 'bike'], priceHour: 30, priceDay: 220,
    amenities: ['CCTV', 'Covered'], openTime: '00:00', closeTime: '23:59',
    description: 'Cozy residential parking in a quiet lane, 5 min walk from World Trade Park.',
  },
  {
    title: 'C-Scheme Bike & Car Park',
    address: 'C-22, Sardar Patel Marg, C-Scheme, Jaipur',
    lat: 26.9129, lng: 75.7995,
    capacity: 4, vehicleTypes: ['bike', 'car'], priceHour: 25, priceDay: 180,
    amenities: ['CCTV', 'EV Charging'], openTime: '07:00', closeTime: '22:00',
    description: 'Well-lit parking for bikes and cars near C-Scheme market.',
  },
  {
    title: 'Vaishali Nagar Covered Parking',
    address: 'A-101, Amrapali Circle, Vaishali Nagar, Jaipur',
    lat: 26.9265, lng: 75.7250,
    capacity: 2, vehicleTypes: ['car'], priceHour: 35, priceDay: 250,
    amenities: ['Covered', 'Security Guard'], openTime: '06:30', closeTime: '23:30',
    description: 'Covered family parking spot near Inox cinema, Vaishali.',
  },
  {
    title: 'Mansarovar Metro Parking',
    address: 'Plot 7, Near Mansarovar Metro Station, Jaipur',
    lat: 26.8820, lng: 75.7505,
    capacity: 5, vehicleTypes: ['car', 'bike', 'suv'], priceHour: 20, priceDay: 150,
    amenities: ['CCTV', 'EV Charging', 'Security Guard'], openTime: '00:00', closeTime: '23:59',
    description: 'Large open parking right next to Mansarovar metro — ideal for commuters.',
  },
  {
    title: 'Johari Bazaar Heritage Parking',
    address: '221, Johari Bazaar, Pink City, Jaipur',
    lat: 26.9245, lng: 75.8245,
    capacity: 1, vehicleTypes: ['bike'], priceHour: 20, priceDay: 160,
    amenities: ['CCTV'], openTime: '08:00', closeTime: '21:00',
    description: 'Single secure bike slot in the heart of the old city bazaar.',
  },
  {
    title: 'Tonk Road SUV Parking',
    address: '14, Tonk Road, Near Sanganer, Jaipur',
    lat: 26.8721, lng: 75.8021,
    capacity: 2, vehicleTypes: ['suv', 'car'], priceHour: 50, priceDay: 350,
    amenities: ['CCTV', 'Covered', 'Security Guard'], openTime: '06:00', closeTime: '23:00',
    description: 'Extra-wide slots built for SUVs, near Sanganer textile market.',
  },
  {
    title: 'Raja Park Night Parking',
    address: '88, Raja Park, Jaipur',
    lat: 26.9001, lng: 75.8150,
    capacity: 3, vehicleTypes: ['car', 'bike'], priceHour: 60, priceDay: 400,
    amenities: ['CCTV', 'Security Guard', 'Covered', 'EV Charging'], openTime: '18:00', closeTime: '08:00',
    description: 'Premium overnight parking with EV charging in Raja Park.',
  },
];

async function main() {
  if (!MONGO_URI) throw new Error('MONGO_URI is not set in .env');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB. Wiping database...');
  await mongoose.connection.db.dropDatabase();

  // Users
  const createdUsers = {};
  for (const u of users) {
    const doc = await User.create(u); // password hashed by pre-save hook
    createdUsers[u.email] = doc;
  }
  console.log(`Created ${users.length} users`);

  // Parking spots (all approved)
  const owner1 = createdUsers['owner1@park.com'];
  const owner2 = createdUsers['owner2@park.com'];
  const customer = createdUsers['customer@park.com'];
  const createdSpots = [];
  for (let i = 0; i < spots.length; i++) {
    const s = spots[i];
    const doc = await ParkingSpot.create({
      ownerId: (i < 5 ? owner1 : owner2)._id,
      title: s.title,
      address: s.address,
      location: { type: 'Point', coordinates: [s.lng, s.lat] },
      capacity: s.capacity,
      vehicleType: s.vehicleTypes[0], // legacy field
      vehicleTypes: s.vehicleTypes,
      priceHour: s.priceHour,
      priceDay: s.priceDay,
      status: 'approved',
      amenities: s.amenities,
      description: s.description,
      openTime: s.openTime,
      closeTime: s.closeTime,
      photos: [
        `https://picsum.photos/seed/parking${i + 1}a/800/600`,
        `https://picsum.photos/seed/parking${i + 1}b/800/600`,
      ],
    });
    createdSpots.push(doc);
  }
  console.log(`Created ${createdSpots.length} approved parking spots`);

  // Completed bookings with transactions
  const now = Date.now();
  const completedPlans = [
    { spot: 0, hoursAgo: 50, durationHrs: 5, vehicle: 'RJ14 AB 1234' },
    { spot: 2, hoursAgo: 30, durationHrs: 30, vehicle: 'RJ14 CD 5678' },
    { spot: 5, hoursAgo: 10, durationHrs: 3, vehicle: 'RJ14 EF 9012' },
  ];
  for (const plan of completedPlans) {
    const spot = createdSpots[plan.spot];
    const startTime = new Date(now - plan.hoursAgo * 3600000);
    const endTime = new Date(startTime.getTime() + plan.durationHrs * 3600000);
    const totalAmount = calculatePrice(startTime, endTime, spot.priceHour, spot.priceDay);
    const booking = await Booking.create({
      parkingId: spot._id,
      userId: customer._id,
      mobile: customer.mobile,
      name: customer.name,
      vehicleNumber: plan.vehicle,
      startTime,
      endTime,
      totalAmount,
      status: 'completed',
    });
    await paymentService.markPaid(booking._id);
  }
  console.log('Created 3 completed bookings with transactions');

  // One running booking (exercises OTP + capacity sync)
  const runningSpot = createdSpots[1]; // capacity 3
  await bookingService.start({
    mobile: customer.mobile,
    name: customer.name,
    vehicleNumber: 'RJ14 GH 3456',
    parkingId: runningSpot._id,
    userId: customer._id,
  });
  console.log('Created 1 running booking');

  // Reviews (post-save hook recomputes avgRating + ratingCount)
  const reviewPlans = [
    { spot: 0, rating: 5, comment: 'Very secure, guard was helpful. Will park again!' },
    { spot: 0, rating: 4, comment: 'Good location near MI Road, slightly tight entry.' },
    { spot: 2, rating: 5, comment: 'Great EV charging facility for my bike.' },
    { spot: 4, rating: 4, comment: 'Perfect for metro commuters, cheap day rates.' },
  ];
  for (const r of reviewPlans) {
    await Review.create({
      spotId: createdSpots[r.spot]._id,
      userId: customer._id,
      rating: r.rating,
      comment: r.comment,
    });
  }
  console.log('Created 4 reviews (avgRating updated via hook)');

  console.log('\n===== DEMO CREDENTIALS =====');
  console.log('Admin      : admin@park.com    / admin123');
  console.log('HouseOwner : owner1@park.com   / owner123');
  console.log('HouseOwner : owner2@park.com   / owner123');
  console.log('Customer   : customer@park.com / customer123');
  console.log('============================\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
