import dotenv from 'dotenv'
import connectDB from './config/db.js'
import Expert from './models/Expert.js'

dotenv.config()

// Generate a date string N days from now (YYYY-MM-DD)
const futureDate = (daysAhead) => {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().split('T')[0]
}

const experts = [
  {
    name: 'Ava Johnson',
    category: 'Technology',
    experience: 9,
    rating: 4.9,
    summary: 'Full-stack engineer focused on product architecture and scaling engineering teams at high-growth startups.',
    availability: [
      { date: futureDate(1), slots: [{ timeSlot: '10:00 AM' }, { timeSlot: '11:30 AM' }, { timeSlot: '02:00 PM' }] },
      { date: futureDate(2), slots: [{ timeSlot: '09:00 AM' }, { timeSlot: '01:00 PM' }, { timeSlot: '04:00 PM' }] },
      { date: futureDate(5), slots: [{ timeSlot: '10:30 AM' }, { timeSlot: '03:00 PM' }] }
    ]
  },
  {
    name: 'Daniel Kim',
    category: 'Finance',
    experience: 12,
    rating: 4.8,
    summary: 'Investment advisor for early-stage founders and operators. Specialises in fundraising strategy and financial modelling.',
    availability: [
      { date: futureDate(1), slots: [{ timeSlot: '09:30 AM' }, { timeSlot: '12:00 PM' }, { timeSlot: '03:30 PM' }] },
      { date: futureDate(3), slots: [{ timeSlot: '10:30 AM' }, { timeSlot: '01:30 PM' }, { timeSlot: '05:00 PM' }] }
    ]
  },
  {
    name: 'Priya Shah',
    category: 'Career',
    experience: 8,
    rating: 4.7,
    summary: 'Interview coach and leadership mentor for growth-stage professionals aiming at director and VP roles.',
    availability: [
      { date: futureDate(2), slots: [{ timeSlot: '10:00 AM' }, { timeSlot: '12:30 PM' }, { timeSlot: '03:00 PM' }] },
      { date: futureDate(4), slots: [{ timeSlot: '09:00 AM' }, { timeSlot: '11:00 AM' }, { timeSlot: '02:30 PM' }] }
    ]
  },
  {
    name: 'Marcus Williams',
    category: 'Marketing',
    experience: 7,
    rating: 4.6,
    summary: 'Growth marketer and brand strategist with a track record of scaling B2C products from zero to millions.',
    availability: [
      { date: futureDate(1), slots: [{ timeSlot: '08:00 AM' }, { timeSlot: '11:00 AM' }, { timeSlot: '02:30 PM' }] },
      { date: futureDate(3), slots: [{ timeSlot: '09:30 AM' }, { timeSlot: '01:00 PM' }] },
      { date: futureDate(6), slots: [{ timeSlot: '10:00 AM' }, { timeSlot: '03:30 PM' }, { timeSlot: '05:00 PM' }] }
    ]
  },
  {
    name: 'Sofia Martinez',
    category: 'Wellness',
    experience: 10,
    rating: 4.9,
    summary: 'Certified executive wellness coach helping leaders beat burnout and build sustainable high-performance habits.',
    availability: [
      { date: futureDate(2), slots: [{ timeSlot: '07:00 AM' }, { timeSlot: '09:00 AM' }, { timeSlot: '05:00 PM' }] },
      { date: futureDate(4), slots: [{ timeSlot: '08:00 AM' }, { timeSlot: '12:00 PM' }, { timeSlot: '04:00 PM' }] }
    ]
  },
  {
    name: 'James Okafor',
    category: 'Business',
    experience: 15,
    rating: 4.8,
    summary: 'Serial entrepreneur and business development consultant. Has founded and exited three companies across SaaS and logistics.',
    availability: [
      { date: futureDate(1), slots: [{ timeSlot: '10:00 AM' }, { timeSlot: '02:00 PM' }, { timeSlot: '04:30 PM' }] },
      { date: futureDate(5), slots: [{ timeSlot: '09:00 AM' }, { timeSlot: '11:30 AM' }, { timeSlot: '03:00 PM' }] }
    ]
  },
  {
    name: 'Leila Ahmadi',
    category: 'Technology',
    experience: 6,
    rating: 4.5,
    summary: 'AI/ML engineer specialising in LLM fine-tuning and production deployment of machine learning pipelines.',
    availability: [
      { date: futureDate(2), slots: [{ timeSlot: '11:00 AM' }, { timeSlot: '01:30 PM' }, { timeSlot: '03:30 PM' }] },
      { date: futureDate(3), slots: [{ timeSlot: '10:00 AM' }, { timeSlot: '02:00 PM' }] },
      { date: futureDate(7), slots: [{ timeSlot: '09:30 AM' }, { timeSlot: '12:30 PM' }, { timeSlot: '04:00 PM' }] }
    ]
  },
  {
    name: 'Nathan Brooks',
    category: 'Finance',
    experience: 11,
    rating: 4.7,
    summary: 'CFO advisor and financial systems architect. Helps scale-ups build finance teams and close Series A and B rounds.',
    availability: [
      { date: futureDate(1), slots: [{ timeSlot: '09:00 AM' }, { timeSlot: '11:30 AM' }, { timeSlot: '03:00 PM' }] },
      { date: futureDate(4), slots: [{ timeSlot: '10:00 AM' }, { timeSlot: '01:00 PM' }, { timeSlot: '04:30 PM' }] }
    ]
  },
  {
    name: 'Rachel Chen',
    category: 'Career',
    experience: 5,
    rating: 4.4,
    summary: 'Early-career coach for recent graduates and professionals pivoting into tech and product management roles.',
    availability: [
      { date: futureDate(2), slots: [{ timeSlot: '09:00 AM' }, { timeSlot: '11:00 AM' }, { timeSlot: '01:00 PM' }] },
      { date: futureDate(5), slots: [{ timeSlot: '10:00 AM' }, { timeSlot: '02:00 PM' }, { timeSlot: '04:00 PM' }] }
    ]
  },
  {
    name: 'Omar Hassan',
    category: 'Business',
    experience: 9,
    rating: 4.6,
    summary: 'Operations consultant specialising in supply chain optimisation, OKR frameworks, and lean process design.',
    availability: [
      { date: futureDate(3), slots: [{ timeSlot: '08:30 AM' }, { timeSlot: '11:00 AM' }, { timeSlot: '02:30 PM' }] },
      { date: futureDate(6), slots: [{ timeSlot: '09:00 AM' }, { timeSlot: '01:30 PM' }, { timeSlot: '04:00 PM' }] }
    ]
  }
]

const run = async () => {
  await connectDB()
  await Expert.deleteMany({})
  await Expert.insertMany(experts)
  console.log(`Seeded ${experts.length} experts successfully`)
  process.exit(0)
}

run().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})