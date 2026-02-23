require('dotenv').config();
const { notifyDiscord } = require('./utils/discordService');

const runTest = async () => {
  console.log('🤖 Testing Discord Webhook Service...');
  
  if (!process.env.DISCORD_WEBHOOK_URL) {
      console.error('❌ DISCORD_WEBHOOK_URL is missing in .env! Please add your Webhook URL.');
      return;
  }
  
  console.log(`Using Webhook URL: ${process.env.DISCORD_WEBHOOK_URL.substring(0, 35)}...`);

  // Mock Event Data
  const mockEvent = {
      _id: '507f1f77bcf86cd799439011',
      eventName: 'Test Event - Felicity Launch Party',
      eventDescription: 'This is a test notification to verify the Discord integration for the Felicity Event Management System. 🚀',
      eventStartDate: new Date(Date.now() + 86400000), // Tomorrow
      eventType: 'Normal',
      organizer: { 
          organizerName: 'Felicity Tech Team' 
      }
  };

  console.log(`📢 Sending test notification for event: "${mockEvent.eventName}"...`);
  
  await notifyDiscord(mockEvent);
  
  console.log('Done.');
};

runTest();
