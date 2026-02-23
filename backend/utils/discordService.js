const fetch = global.fetch || require('node-fetch');

/**
 * Send notification to Discord Webhook
 * @param {Object} event - The event object
 */
const notifyDiscord = async (event) => {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.log('⚠️ Discord Webhook URL not configured. Skipping notification.');
      return;
    }

    const embed = {
      title: `🎉 New Event Published: ${event.eventName}`,
      description: event.eventDescription.substring(0, 200) + (event.eventDescription.length > 200 ? '...' : ''),
      url: `${process.env.FRONTEND_URL}/events/${event._id}`,
      color: 5814783, // #58b9ff kind of blue
      fields: [
        {
          name: '📅 Date',
          value: new Date(event.eventStartDate).toLocaleString(),
          inline: true
        },
        {
          name: '📍 Type',
          value: event.eventType,
          inline: true
        },
        {
          name: '🎭 Organizer',
          value: event.organizer.organizerName || 'Felicity Team',
          inline: true
        }
      ],
      footer: {
        text: 'Felicity Event Management System'
      },
      timestamp: new Date().toISOString()
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed]
      }),
    });

    if (response.ok) {
      console.log('✅ Discord notification sent successfully.');
    } else {
      console.error(`❌ Discord API Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Failed to send Discord notification:', error.message);
  }
};

module.exports = {
  notifyDiscord
};
