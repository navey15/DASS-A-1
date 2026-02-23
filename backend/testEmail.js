require('dotenv').config();
const { sendTicketEmail } = require('./utils/emailService');

const runTest = async () => {
  console.log('🧪 Testing Email Service...');
  console.log(`Using Email: ${process.env.EMAIL_USER}`);

  if (!process.env.EMAIL_PASS) {
      console.error('❌ EMAIL_PASS is missing in .env! Please add your App Password.');
      return;
  }

  // Mock Data
  const mockUser = {
      email: process.env.EMAIL_USER, // Send to self
      firstName: 'TestUser'
  };

  const mockEvent = {
      eventName: 'Test Event 2026',
      eventStartDate: new Date(),
      organizer: { organizerName: 'Test Club' }
  };

  const mockRegistration = {
      ticketId: 'TEST-Ticket-12345'
  };

  console.log(`📨 Sending test email to ${mockUser.email}...`);
  
  const success = await sendTicketEmail(mockUser, mockEvent, mockRegistration);

  if (success) {
      console.log('✅ Email sent successfully! Check your inbox.');
  } else {
      console.log('❌ Email failed to send. Check the error logs above.');
  }
};

runTest();
