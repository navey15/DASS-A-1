const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Event = require('./models/Event');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Sample data
const sampleData = {
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@felicity.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    role: 'admin'
  },
  
  participants: [
    {
      email: 'john.doe@students.iiit.ac.in',
      password: 'John@123456',
      role: 'participant',
      firstName: 'John',
      lastName: 'Doe',
      participantType: 'IIIT',
      college: 'IIIT Hyderabad',
      contactNumber: '9876543210',
      areasOfInterest: ['Coding', 'Hackathon', 'AI/ML']
    },
    {
      email: 'jane.smith@gmail.com',
      password: 'Jane@123456',
      role: 'participant',
      firstName: 'Jane',
      lastName: 'Smith',
      participantType: 'Non-IIIT',
      college: 'IIT Kharagpur',
      contactNumber: '9876543211',
      areasOfInterest: ['Music', 'Dance', 'Drama']
    }
  ]
};

/**
 * Seed database with initial data
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data (optional - comment out if you want to preserve existing data)
    console.log('Clearing existing users and events...');
    await User.deleteMany({});
    await Event.deleteMany({});
    console.log('✓ Existing users and events cleared\n');
    
    // Create admin
    console.log('Creating admin account...');
    const admin = await User.create(sampleData.admin);
    console.log(`✓ Admin created: ${admin.email}\n`);
    
    // Create participants
    console.log('Creating participant accounts...');
    for (const participantData of sampleData.participants) {
      const participant = await User.create(participantData);
      console.log(`✓ Participant created: ${participant.firstName} ${participant.lastName} (${participant.email})`);
    }
    console.log('');

    console.log('Skipping default organizer/event creation. Use the admin dashboard to add organizers.\n');
    
    console.log('✅ Database seeding completed successfully!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('Default Credentials:');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n👤 ADMIN:');
    console.log(`   Email: ${sampleData.admin.email}`);
    console.log(`   Password: ${sampleData.admin.password}`);
    
    console.log('👨‍🎓 PARTICIPANTS:');
    sampleData.participants.forEach(part => {
      console.log(`   ${part.firstName} ${part.lastName}:`);
      console.log(`   Email: ${part.email}`);
      console.log(`   Password: ${part.password}\n`);
    });
    
    console.log('═══════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
