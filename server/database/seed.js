/**
 * SkillMatch.lk — Database Seed Script
 * Run: node database/seed.js
 * Creates demo users, worker profiles, gigs, jobs, and reviews.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Gig = require('../models/Gig');
const Job = require('../models/Job');
const Review = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skillmatchlk';

// ── Seed data ──────────────────────────────────────────────────────────────

const users = [
  { name: 'Admin User',          email: 'admin@skillmatch.lk',    password: 'Admin@123',    role: 'admin',    isVerified: true,  status: 'active' },
  { name: 'Kasun Perera',        email: 'worker@skillmatch.lk',   password: 'Worker@123',   role: 'worker',   isVerified: true,  status: 'active' },
  { name: 'Nimasha Silva',       email: 'nimasha@skillmatch.lk',  password: 'Worker@123',   role: 'worker',   isVerified: true,  status: 'active' },
  { name: 'Tharindu Fernando',   email: 'tharindu@skillmatch.lk', password: 'Worker@123',   role: 'worker',   isVerified: false, status: 'active' },
  { name: 'Ruwan Bandara',       email: 'ruwan@skillmatch.lk',    password: 'Worker@123',   role: 'worker',   isVerified: true,  status: 'active' },
  { name: 'Sachini Wickrama',    email: 'sachini@skillmatch.lk',  password: 'Worker@123',   role: 'worker',   isVerified: true,  status: 'active' },
  { name: 'Amara Dissanayake',   email: 'customer@skillmatch.lk', password: 'Customer@123', role: 'customer', isVerified: true,  status: 'active' },
  { name: 'Priya Ratnayake',     email: 'priya@skillmatch.lk',    password: 'Customer@123', role: 'customer', isVerified: true,  status: 'active' },
  { name: 'Saman Kumara',        email: 'saman@skillmatch.lk',    password: 'Customer@123', role: 'customer', isVerified: true,  status: 'active' },
];

const workerProfiles = (userIds) => [
  {
    userId: userIds[1], bio: 'Full-stack developer with 5+ years building scalable web apps. React, Node.js, cloud architecture.',
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'], experience: 5,
    location: { city: 'Colombo', district: 'Colombo', province: 'Western' },
    hourlyRate: 3500, availability: 'available', category: 'Web Development',
    certifications: ['AWS Certified Developer', 'Google Cloud Professional'],
    portfolio: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400'],
    averageRating: 4.9, totalReviews: 47, completedJobs: 63, isVerified: true,
  },
  {
    userId: userIds[2], bio: 'Creative UI/UX designer. Beautiful, user-centered designs that convert.',
    skills: ['Figma', 'Adobe XD', 'Illustrator', 'Photoshop', 'Branding'], experience: 4,
    location: { city: 'Kandy', district: 'Kandy', province: 'Central' },
    hourlyRate: 2800, availability: 'available', category: 'Graphic Design',
    certifications: ['Google UX Design Certificate'], portfolio: [],
    averageRating: 4.8, totalReviews: 32, completedJobs: 41, isVerified: true,
  },
  {
    userId: userIds[3], bio: 'Licensed electrician, 8 years residential & commercial experience.',
    skills: ['Wiring', 'Panel Upgrades', 'Solar Installation', 'CCTV'], experience: 8,
    location: { city: 'Gampaha', district: 'Gampaha', province: 'Western' },
    hourlyRate: 1800, availability: 'busy', category: 'Electrical',
    certifications: ['Licensed Electrician - SLTB'], portfolio: [],
    averageRating: 4.7, totalReviews: 89, completedJobs: 124, isVerified: false,
  },
  {
    userId: userIds[4], bio: 'Professional plumber. Available 24/7 for emergencies.',
    skills: ['Pipe Fitting', 'Bathroom Renovation', 'Water Heaters', 'Leak Repair'], experience: 10,
    location: { city: 'Matara', district: 'Matara', province: 'Southern' },
    hourlyRate: 1500, availability: 'available', category: 'Plumbing',
    certifications: ['Certified Plumber - TVEC'], portfolio: [],
    averageRating: 4.8, totalReviews: 156, completedJobs: 203, isVerified: true,
  },
  {
    userId: userIds[5], bio: 'Professional photographer. Weddings, corporate events, product photography.',
    skills: ['Wedding Photography', 'Portrait', 'Product Photography', 'Photo Editing'], experience: 6,
    location: { city: 'Colombo', district: 'Colombo', province: 'Western' },
    hourlyRate: 4500, availability: 'available', category: 'Photography',
    certifications: ['Adobe Certified Expert'], portfolio: [],
    averageRating: 5.0, totalReviews: 38, completedJobs: 52, isVerified: true,
  },
];

const gigs = (userIds) => [
  {
    workerId: userIds[1], title: 'I will build a full-stack web application with React and Node.js',
    description: 'Professional full-stack development using React, Node.js, MongoDB. Includes responsive design, authentication, and deployment.',
    category: 'Web Development', price: 25000,
    images: ['https://images.unsplash.com/photo-1547658719-da2b51169166?w=600'],
    deliveryTime: 14, deliveryUnit: 'days', isActive: true,
    tags: ['React', 'Node.js', 'Full Stack'], totalOrders: 23, views: 1240,
  },
  {
    workerId: userIds[2], title: 'I will design a stunning UI/UX for your mobile or web app',
    description: 'Complete UI/UX design with wireframes, prototypes, and final Figma files.',
    category: 'Graphic Design', price: 15000,
    images: ['https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600'],
    deliveryTime: 7, deliveryUnit: 'days', isActive: true,
    tags: ['UI Design', 'UX', 'Figma'], totalOrders: 18, views: 890,
  },
  {
    workerId: userIds[5], title: 'I will photograph your wedding or corporate event professionally',
    description: 'Full-day event photography with 300+ edited photos delivered within 7 days.',
    category: 'Photography', price: 45000,
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=600'],
    deliveryTime: 7, deliveryUnit: 'days', isActive: true,
    tags: ['Wedding', 'Events', 'Photography'], totalOrders: 31, views: 2100,
  },
];

const jobs = (userIds) => [
  {
    customerId: userIds[6], workerId: userIds[1],
    title: 'Build an e-commerce website for my clothing store',
    description: 'Need a full e-commerce site with product listings, cart, and payment integration.',
    category: 'Web Development', budget: 40000, status: 'completed',
    deadline: new Date(Date.now() + 30 * 86400000), isReviewed: true, attachments: [],
  },
  {
    customerId: userIds[7], workerId: userIds[2],
    title: 'Design a logo and brand identity for my startup',
    description: 'Need a modern logo, color palette, and brand guidelines for a tech startup.',
    category: 'Graphic Design', budget: 20000, status: 'in-progress',
    deadline: new Date(Date.now() + 14 * 86400000), isReviewed: false, attachments: [],
  },
  {
    customerId: userIds[8], workerId: userIds[4],
    title: 'Fix bathroom plumbing and install new fixtures',
    description: 'Bathroom renovation — replace pipes, install new shower, fix leaks.',
    category: 'Plumbing', budget: 15000, status: 'completed',
    deadline: new Date(Date.now() + 7 * 86400000), isReviewed: true, attachments: [],
  },
  {
    customerId: userIds[6],
    title: 'Looking for an electrician for home rewiring',
    description: 'Full home rewiring project, 3-bedroom house in Colombo.',
    category: 'Electrical', budget: 35000, status: 'pending',
    deadline: new Date(Date.now() + 21 * 86400000), isReviewed: false, attachments: [],
  },
];

const reviews = (userIds, jobIds) => [
  {
    customerId: userIds[6], workerId: userIds[1], jobId: jobIds[0],
    rating: 5, comment: 'Kasun delivered an exceptional web application. Outstanding code quality and perfect communication throughout. Highly recommended!',
    isVisible: true,
  },
  {
    customerId: userIds[8], workerId: userIds[4], jobId: jobIds[2],
    rating: 5, comment: 'Ruwan fixed our plumbing quickly and professionally. Arrived on time, explained everything clearly, very reasonable price. 5 stars!',
    isVisible: true,
  },
];

// ── Main seed function ─────────────────────────────────────────────────────

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      WorkerProfile.deleteMany({}),
      Gig.deleteMany({}),
      Job.deleteMany({}),
      Review.deleteMany({}),
    ]);

    // Create users (passwords hashed by pre-save hook)
    console.log('👤 Creating users...');
    const createdUsers = await User.create(users);
    const userIds = createdUsers.map(u => u._id);
    console.log(`   ✓ ${createdUsers.length} users created`);

    // Create worker profiles
    console.log('👷 Creating worker profiles...');
    const createdProfiles = await WorkerProfile.create(workerProfiles(userIds));
    console.log(`   ✓ ${createdProfiles.length} worker profiles created`);

    // Create gigs
    console.log('💼 Creating gigs...');
    const createdGigs = await Gig.create(gigs(userIds));
    console.log(`   ✓ ${createdGigs.length} gigs created`);

    // Create jobs
    console.log('📋 Creating jobs...');
    const createdJobs = await Job.create(jobs(userIds));
    const jobIds = createdJobs.map(j => j._id);
    console.log(`   ✓ ${createdJobs.length} jobs created`);

    // Create reviews
    console.log('⭐ Creating reviews...');
    const createdReviews = await Review.create(reviews(userIds, jobIds));
    console.log(`   ✓ ${createdReviews.length} reviews created`);

    console.log('\n🎉 Seed complete! Login credentials:\n');
    console.log('  Role      | Email                        | Password');
    console.log('  ----------|------------------------------|-------------');
    console.log('  Admin     | admin@skillmatch.lk          | Admin@123');
    console.log('  Worker    | worker@skillmatch.lk         | Worker@123');
    console.log('  Customer  | customer@skillmatch.lk       | Customer@123');
    console.log('\n  All worker accounts use: Worker@123');
    console.log('  All customer accounts use: Customer@123\n');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
