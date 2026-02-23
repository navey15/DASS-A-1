const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { sendSuccess, sendError, generateInviteCode } = require('../utils/helpers');
const { sendTicketEmail, sendMerchandiseConfirmation } = require('../utils/emailService');

/**
 * Register for an event
 * POST /api/registrations/:eventId
 */
const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Parse formResponses and merchandisePurchase if they are strings (from multipart data)
    let formResponses = req.body.formResponses;
    let merchandisePurchase = req.body.merchandisePurchase;
    
    try {
      if (typeof formResponses === 'string') {
        formResponses = JSON.parse(formResponses);
      }
      if (typeof merchandisePurchase === 'string') {
        merchandisePurchase = JSON.parse(merchandisePurchase);
      }
    } catch (e) {
      console.error('Error parsing JSON fields:', e);
    }

    const { isTeamRegistration, teamName } = req.body;
    let targetTeamSize = req.body.targetTeamSize; // Allow parsing from req.body

    // Parse targetTeamSize if it's a string (from multipart data)
    try {
        if (typeof targetTeamSize === 'string') {
            targetTeamSize = parseInt(targetTeamSize);
        }
    } catch (e) {
        console.error('Error parsing targetTeamSize:', e);
    }
    
    // Check if user is a participant
    if (req.user.role !== 'participant') {
      return sendError(res, 403, 'Only participants can register for events.');
    }
    
    // Get event details
    const event = await Event.findById(eventId);
    
    if (!event) {
      return sendError(res, 404, 'Event not found.');
    }
    
    // Check if registration is open
    if (!event.isRegistrationOpen()) {
      return sendError(res, 400, 'Registration is closed for this event.');
    }

    // Validate custom form responses
    if (event.customRegistrationForm && event.customRegistrationForm.fields) {
        // Collect all available responses (body + files)
        const allResponses = { ...(formResponses || {}) };
        
        // If files were uploaded, add them to responses map for validation check
        if (req.files && Array.isArray(req.files)) {
            req.files.forEach(f => {
                if (f.fieldname !== 'paymentProof') {
                    allResponses[f.fieldname] = f.path; // Or just true to signify presence
                }
            });
        }

        for (const field of event.customRegistrationForm.fields) {
            if (field.required) {
                const value = allResponses[field.fieldName];
                if (!value || (Array.isArray(value) && value.length === 0)) {
                     return sendError(res, 400, `Field '${field.label}' is required.`);
                }
            }
        }
    }
    
    // Check eligibility
    if (event.eligibility === 'IIIT Only' && req.user.participantType !== 'IIIT') {
      return sendError(res, 403, 'This event is only for IIIT students.');
    }
    
    if (event.eligibility === 'Non-IIIT Only' && req.user.participantType === 'IIIT') {
      return sendError(res, 403, 'This event is only for Non-IIIT participants.');
    }
    
    // Check if already registered
    const existingRegistration = await Registration.findOne({
      event: eventId,
      $or: [
        { participant: req.user._id },
        { 'team.teamMembers.userId': req.user._id }
      ],
      status: { $ne: 'Cancelled' } // Allow re-registration if cancelled
    });
    
    if (existingRegistration) {
      return sendError(res, 400, 'You are already registered for this event.');
    }
    
    // Check available slots
    if (!event.hasAvailableSlots()) {
      return sendError(res, 400, 'Registration limit reached. Event is full.');
    }
    
    // Prepare registration data
    const registrationData = {
      event: eventId,
      participant: req.user._id,
      formResponses: formResponses || {},
      status: 'Confirmed'
    };
    
    // Handle team registration
    if (isTeamRegistration && event.isTeamEvent) {
      if (!teamName) {
        return sendError(res, 400, 'Team name is required for team registration.');
      }

      if (!targetTeamSize) {
        // If not provided, default to max team size or 1?
        // Requirement implies user sets it.
        // Let's require it or default to max.
        // Better to require it as per "sets the team size".
        targetTeamSize = event.teamSize.max;
        // Or should we error? "leader ... sets the team size". Let's assume default max if not sent, to be safe.
      }

      if (targetTeamSize < event.teamSize.min || targetTeamSize > event.teamSize.max) {
        return sendError(res, 400, `Team size must be between ${event.teamSize.min} and ${event.teamSize.max}.`);
      }
      
      registrationData.isTeamRegistration = true;
      // Mark as Pending until team is full
      registrationData.status = 'Pending';
      
      registrationData.team = {
        teamName,
        teamLeader: req.user._id,
        targetTeamSize: targetTeamSize,
        teamMembers: [],
        inviteCode: generateInviteCode()
      };
    }
    
    // Handle merchandise purchase
    if (event.eventType === 'Merchandise' && merchandisePurchase) {
      // Validate merchandise items and stock
      const items = merchandisePurchase.items || [];
      let totalAmount = 0;
      
      const processedItems = [];

      for (const item of items) {
        const merchItem = event.merchandiseDetails.items.find(
          mi => mi._id.toString() === item.itemId
        );
        
        if (!merchItem) {
          return sendError(res, 400, `Invalid merchandise item: ${item.itemId}`);
        }
        
        if (item.quantity > merchItem.maxPerParticipant) {
          return sendError(res, 400, `Quantity exceeds limit for ${merchItem.name}`);
        }
        
        if (merchItem.stockQuantity < item.quantity) {
          return sendError(res, 400, `Insufficient stock for ${merchItem.name}`);
        }
        
        totalAmount += merchItem.price * item.quantity;
        
        processedItems.push({
          itemId: item.itemId,
          name: merchItem.name,
          price: merchItem.price,
          quantity: item.quantity,
          variant: item.variant // Preserve variant if present
        });
      }
      
      registrationData.merchandisePurchase = {
        items: processedItems,
        totalAmount
      };
      
      registrationData.payment = {
        required: true,
        amount: totalAmount,
        status: 'Pending'
      };
      
      registrationData.status = 'Pending'; // Pending until payment approved
    }
    
    // Handle paid events
    if (event.registrationFee > 0) {
      registrationData.payment = {
        required: true,
        amount: event.registrationFee,
        status: 'Pending'
      };
      registrationData.status = 'Pending';
    }

    // Attach payment proof and custom files if uploaded
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.fieldname === 'paymentProof') {
            if (!registrationData.payment) {
                registrationData.payment = {
                  required: true,
                  amount: 0, 
                  status: 'Pending'
                };
            }
            registrationData.payment.proofImage = file.path;
            registrationData.status = 'Pending'; 
        } else {
             // Custom file upload
             if (!registrationData.formResponses) registrationData.formResponses = {};
             // formResponses is a Map or Object. If initialized as {}, works fine.
             registrationData.formResponses[file.fieldname] = file.path;
        }
      });
    } else if (req.file) {
      // Fallback if single middleware was used unexpectedly
      if (req.file.fieldname === 'paymentProof') {
        if (!registrationData.payment) {
            registrationData.payment = {
              required: true,
              amount: 0, 
              status: 'Pending'
            };
        }
        registrationData.payment.proofImage = req.file.path;
        registrationData.status = 'Pending';
      }
    }

    // Generate Ticket ID and QR Code only if Confirmed
    if (registrationData.status === 'Confirmed') {
        // If ticketId exists (from model default), we can either keep it or overwrite it
        // The model generates TKT-..., let's keep consistent format FEL-... for confirmed if desired
        // But for now, let's just ensure QR code generates
        
        if (!registrationData.ticketId) {
             const ticketId = `FEL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
             registrationData.ticketId = ticketId;
        }

        try {
          // Use whatever ticketId is set (either TKT or FEL or manual)
          const qrCodeData = await QRCode.toDataURL(registrationData.ticketId);
          registrationData.qrCode = qrCodeData;
        } catch (qrError) {
          console.error('QR Code generation failed:', qrError);
        }
    }

    // Create registration
    const registration = await Registration.create(registrationData);
    
    // Increment event registration count
    await event.incrementRegistrations();
    
    // Populate registration details
    const populatedRegistration = await Registration.findById(registration._id)
      .populate('event', 'eventName eventStartDate eventEndDate eventType organizer')
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'organizerName' }
      })
      .populate('participant', 'firstName lastName email');
    
    // Send email notification (async - don't wait for it)
    // Only send ticket/confirmation if status is Confirmed
    if (populatedRegistration.status === 'Confirmed') {
      if (populatedRegistration.event.eventType === 'Merchandise') {
        sendMerchandiseConfirmation(populatedRegistration.participant, populatedRegistration.event, populatedRegistration).catch(err => console.error('Email failed:', err));
      } else {
        sendTicketEmail(populatedRegistration.participant, populatedRegistration.event, populatedRegistration).catch(err => console.error('Email failed:', err));
      }
    }

    sendSuccess(res, 201, 'Successfully registered for the event!', {
      registration: populatedRegistration
    });
  } catch (error) {
    console.error('Event registration error:', error);
    sendError(res, 500, 'Failed to register for event.');
  }
};

/**
 * Get user's registrations
 * GET /api/registrations/my-events
 */
const getMyRegistrations = async (req, res) => {
  try {
    const { status, type = 'upcoming' } = req.query;
    
    const query = {
      $or: [
        { participant: req.user._id },
        { 'team.teamMembers.userId': req.user._id }
      ]
    };
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    const registrations = await Registration.find(query)
      .populate('event', 'eventName eventStartDate eventEndDate eventType organizer status')
      .populate({
        path: 'event',
        populate: {
          path: 'organizer',
          select: 'organizerName category'
        }
      })
      .sort({ registeredAt: -1 });
    
    // Filter by upcoming or past
    const now = new Date();
    let filteredRegistrations = registrations;
    
    if (type === 'upcoming') {
      filteredRegistrations = registrations.filter(
        reg => reg.event && new Date(reg.event.eventStartDate) >= now
      );
    } else if (type === 'past') {
      filteredRegistrations = registrations.filter(
        reg => reg.event && new Date(reg.event.eventEndDate) < now
      );
    }
    
    // Check and fix missing QR codes for confirmed registrations (iterate ALL fetched registrations to be safe)
    for (const reg of registrations) {
        if (reg.status === 'Confirmed') {
            let needsSave = false;
            
            if (!reg.ticketId) {
                 reg.ticketId = `FEL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`; 
                 needsSave = true;
            } 
            
            if (!reg.qrCode && reg.ticketId) {
                try {
                    const qrCodeData = await QRCode.toDataURL(reg.ticketId);
                    reg.qrCode = qrCodeData;
                    needsSave = true;
                } catch (e) { console.error('Auto-fix QR error:', e); }
            }
            
            if (needsSave) {
                 await reg.save();
            }
        }
    }
    
    sendSuccess(res, 200, 'Registrations retrieved successfully.', {
      registrations: filteredRegistrations
    });
  } catch (error) {
    console.error('Get my registrations error:', error);
    sendError(res, 500, 'Failed to retrieve registrations.');
  }
};

/**
 * Cancel registration
 * DELETE /api/registrations/:registrationId
 */
const cancelRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    
    const registration = await Registration.findById(registrationId)
      .populate('event');
    
    if (!registration) {
      return sendError(res, 404, 'Registration not found.');
    }
    
    // Check if user owns this registration
    if (registration.participant.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'You can only cancel your own registrations.');
    }
    
    // Check if event has started
    if (new Date() >= new Date(registration.event.eventStartDate)) {
      return sendError(res, 400, 'Cannot cancel registration after event has started.');
    }
    
    // Update status
    registration.status = 'Cancelled';
    await registration.save();
    
    // Decrement event registration count
    await registration.event.decrementRegistrations();
    
    sendSuccess(res, 200, 'Registration cancelled successfully.');
  } catch (error) {
    console.error('Cancel registration error:', error);
    sendError(res, 500, 'Failed to cancel registration.');
  }
};

/**
 * Get registration details by ticket ID
 * GET /api/registrations/ticket/:ticketId
 */
const getRegistrationByTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    const registration = await Registration.findOne({ ticketId })
      .populate('event', 'eventName eventStartDate eventEndDate organizer')
      .populate('participant', 'firstName lastName email participantType')
      .populate({
        path: 'event',
        populate: {
          path: 'organizer',
          select: 'organizerName category'
        }
      });
    
    if (!registration) {
      return sendError(res, 404, 'Ticket not found.');
    }
    
    sendSuccess(res, 200, 'Registration retrieved successfully.', {
      registration
    });
  } catch (error) {
    console.error('Get registration by ticket error:', error);
    sendError(res, 500, 'Failed to retrieve registration.');
  }
};

/**
 * Join team using invite code
 * POST /api/registrations/join-team
 */
const joinTeam = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    
    if (!inviteCode) {
      return sendError(res, 400, 'Invite code is required.');
    }
    
    // Find registration with this invite code
    const teamRegistration = await Registration.findOne({
      'team.inviteCode': inviteCode
    }).populate('event');
    
    if (!teamRegistration) {
      return sendError(res, 404, 'Invalid invite code.');
    }
    
    // Check if event is still accepting registrations
    if (!teamRegistration.event.isRegistrationOpen()) {
      return sendError(res, 400, 'Registration is closed for this event.');
    }
    
    // Check if user is already registered for this event (in any capacity)
    const existingRegistration = await Registration.findOne({
      event: teamRegistration.event._id,
      $or: [
        { participant: req.user._id },
        { 'team.teamMembers.userId': req.user._id }
      ]
    });

    if (existingRegistration) {
      if (existingRegistration._id.toString() === teamRegistration._id.toString()) {
         return sendError(res, 400, 'You are already a member of this team.');
      } else {
         return sendError(res, 400, 'You are already registered for this event.');
      }
    }
    
    // Check team size limit
    const currentTeamSize = teamRegistration.team.teamMembers.length + 1; // +1 for leader
    // Get target team size from registration, fallback to event max size
    let targetSize = teamRegistration.team.targetTeamSize;
    if (!targetSize) {
        targetSize = teamRegistration.event.teamSize ? teamRegistration.event.teamSize.max : 4; // Fallback
    }
    
    if (currentTeamSize >= targetSize) {
      return sendError(res, 400, 'Team is full.');
    }
    
    // Add user to team
    teamRegistration.team.teamMembers.push({
      userId: req.user._id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      email: req.user.email,
      status: 'Accepted'
    });
    
    // Check if team is now complete (leader + existing members + new member == targetSize)
    const newMemberCount = teamRegistration.team.teamMembers.length + 1; // Members + Leader
    
    // Check payment status (if applicable)
    const isPaymentComplete = !teamRegistration.payment || 
                              !teamRegistration.payment.required || 
                              teamRegistration.payment.status === 'Completed' || 
                              teamRegistration.payment.status === 'Approved';

    if (newMemberCount === teamRegistration.team.targetTeamSize && isPaymentComplete) {
        teamRegistration.status = 'Confirmed';
        
        // Generate Ticket and QR Code now that team is confirmed
        const ticketId = `FEL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        teamRegistration.ticketId = ticketId;
        
        try {
            const qrCodeData = await QRCode.toDataURL(ticketId);
            teamRegistration.qrCode = qrCodeData;
        } catch (qrError) {
             console.error('QR Code generation failed:', qrError);
        }

        await teamRegistration.save(); // Save before sending emails to ensure data is persisted
        
        // Populate leader details to send email
        // We need to re-fetch or populate because participant might be just ID
        await teamRegistration.populate('participant', 'firstName lastName email');
        
        // Send tickets to Leader
        sendTicketEmail(teamRegistration.participant, teamRegistration.event, teamRegistration).catch(err => console.error('Email failed (leader):', err));
        
        // Send tickets to ALL members (including the one just added)
        for (const member of teamRegistration.team.teamMembers) {
            // Construct a user-like object for the email service
            const memberUser = {
                firstName: member.name ? member.name.split(' ')[0] : 'Participant',
                email: member.email
            };
            // Send email to member
            sendTicketEmail(memberUser, teamRegistration.event, teamRegistration).catch(err => console.error(`Email failed (${member.email}):`, err));
        }
    } else {
        await teamRegistration.save();
    }
    
    sendSuccess(res, 200, 'Successfully joined the team!', {
      registration: teamRegistration
    });
  } catch (error) {
    console.error('Join team error:', error);
    sendError(res, 500, 'Failed to join team.');
  }
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
  getRegistrationByTicket,
  joinTeam
};
