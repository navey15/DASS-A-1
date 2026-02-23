const nodemailer = require('nodemailer');

// Configure transporter
// In production, use environment variables: process.env.EMAIL_USER, process.env.EMAIL_PASS
const transporter = nodemailer.createTransport({
  service: 'gmail', // or use host/port for other providers
  auth: {
    user: process.env.EMAIL_USER || 'felicity.iiit@gmail.com', // Fallback for dev/demo if not set (won't work without real creds)
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

/**
 * Send email helper
 */
const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    if (!process.env.EMAIL_USER && !process.env.EMAIL_PASS) {
      console.log('⚠️ Email credentials not found in .env. Logging email to console instead.');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('--- Body ---');
      console.log(html.substring(0, 100) + '...');
      if (attachments.length > 0) {
        console.log(`--- Attachments: ${attachments.length} ---`);
      }
      console.log('------------');
      return true;
    }

    const mailOptions = {
      from: `"Felicity Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.log('⚠️ Falling back to console log due to error:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--- Body ---');
    const previewText = html.replace(/<[^>]*>/g, '').substring(0, 200).replace(/\s+/g, ' ').trim();
    console.log(previewText + '...');
    console.log('------------');
    return false;
  }
};

/**
 * Send Event Registration Ticket
 */
const sendTicketEmail = async (user, event, registration) => {
  const subject = `Confirmation: ${event.eventName} Ticket - Felicity`;
  
  const attachments = [];
  let qrCodeHtml = '';

  if (registration.qrCode) {
    // Remove the data URL prefix if present to get just the base64 string
    const base64Data = registration.qrCode.split(',')[1];
    
    attachments.push({
      filename: 'ticket-qr.png',
      content: base64Data,
      encoding: 'base64',
      cid: 'ticketqrcode' // same cid value as in the html img src
    });
    
    qrCodeHtml = `<img src="cid:ticketqrcode" alt="Ticket QR Code" style="width: 150px; height: 150px; margin: 10px auto; display: block;" />`;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #333;">Registration Confirmed!</h2>
      <p>Hi ${user.firstName},</p>
      <p>You have successfully registered for <strong>${event.eventName}</strong>.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
        <h3 style="margin-top: 0;">Event Details</h3>
        <p><strong>Date:</strong> ${new Date(event.eventStartDate).toLocaleString()}</p>
        <p><strong>Location:</strong> IIIT Hyderabad</p>
        <p><strong>Organizer:</strong> ${event.organizer.organizerName || 'Felicity Team'}</p>
      </div>

      <div style="text-align: center; margin: 30px 0; padding: 20px; border: 2px dashed #333;">
        <h3 style="margin: 0;">TICKET ID</h3>
        <h1 style="margin: 10px 0; letter-spacing: 2px;">${registration.ticketId || registration._id}</h1>
        ${qrCodeHtml}
        <p style="font-size: 12px; color: #666;">Please show this QR code at the venue.</p>
      </div>

      <p>Need help? Reply to this email.</p>
      <p>Best regards,<br>The Felicity Team</p>
    </div>
  `;

  return sendEmail(user.email, subject, html, attachments);
};

/**
 * Send Merchandise Purchase Confirmation
 */
const sendMerchandiseConfirmation = async (user, event, registration) => {
  const subject = `Order Confirmed: ${event.eventName} Merchandise - Felicity`;
  
  const itemsList = registration.merchandisePurchase.items.map(item => 
    `<li>${item.name || 'Item'} (Qty: ${item.quantity}) - ₹${item.price || 0}</li>`
  ).join('');

  const attachments = [];
  let qrCodeHtml = '';

  if (registration.qrCode) {
    const base64Data = registration.qrCode.split(',')[1];
    
    attachments.push({
      filename: 'order-qr.png',
      content: base64Data,
      encoding: 'base64',
      cid: 'orderqrcode'
    });
    
    qrCodeHtml = `<img src="cid:orderqrcode" alt="Order QR Code" style="width: 150px; height: 150px; margin: 10px auto; display: block;" />`;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #333;">Order Confirmed!</h2>
      <p>Hi ${user.firstName},</p>
      <p>Your purchase for <strong>${event.eventName}</strong> merchandise has been confirmed.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <ul>
          ${itemsList}
        </ul>
        <hr>
        <p><strong>Total Amount:</strong> ₹${registration.merchandisePurchase.totalAmount || 0}</p>
      </div>

      <div style="text-align: center; margin: 30px 0; padding: 20px; border: 2px dashed #333;">
        <h3 style="margin: 0;">Order ID</h3>
        <h1 style="margin: 10px 0; letter-spacing: 2px;">${registration.ticketId || registration._id}</h1>
        ${qrCodeHtml}
        <p style="font-size: 12px; color: #666;">Use this QR code to collect your merchandise.</p>
      </div>

      <p>Best regards,<br>The Felicity Team</p>
    </div>
  `;

  return sendEmail(user.email, subject, html, attachments);
};

module.exports = {
  sendTicketEmail,
  sendMerchandiseConfirmation
};
