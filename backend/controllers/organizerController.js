const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Discussion = require('../models/Discussion');
const Feedback = require('../models/Feedback');
const { sendSuccess, sendError } = require('../utils/helpers');
const { notifyDiscord } = require('../utils/discordService');

/**
 * Get dashboard statistics for organizer
 * GET /api/organizer/dashboard/stats
 */
const getOrganizerDashboardStats = async (req, res) => {
  try {
    const organizerId = req.user._id;

    // 1. Event Statistics
    const events = await Event.find({ organizer: organizerId }).lean();
    
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status === 'Published' || e.status === 'Ongoing').length;
    const totalRegistrations = events.reduce((sum, event) => sum + (event.currentRegistrations || 0), 0);

    // 2. Upcoming Events
    const now = new Date();
    const upcomingEvents = await Event.find({ 
      organizer: organizerId,
      eventStartDate: { $gte: now } 
    })
    .sort({ eventStartDate: 1 })
    .limit(5)
    .select('eventName eventStartDate status currentRegistrations eventType')
    .lean();

    // 3. Recent Activity (Registrations)
    const eventIds = events.map(e => e._id);
    const recentActivity = await Registration.find({ event: { $in: eventIds } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('participant', 'firstName lastName')
      .populate('event', 'eventName')
      .lean();

    sendSuccess(res, 200, 'Dashboard stats retrieved successfully.', {
      stats: {
        totalEvents,
        totalRegistrations,
        activeEvents
      },
      upcomingEvents,
      recentActivity: recentActivity.map(reg => ({
        _id: reg._id,
        type: 'registration',
        description: `${reg.participant?.firstName} ${reg.participant?.lastName} registered for ${reg.event?.eventName}`,
        date: reg.createdAt
      }))
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    sendError(res, 500, 'Failed to retrieve dashboard stats.');
  }
};

/**
 * Create a new event (Draft or Published)
 * POST /api/organizer/events
 */
const createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user._id
    };
    
    // Validate team event fields
    if (eventData.isTeamEvent) {
      if (!eventData.teamSize || !eventData.teamSize.min || !eventData.teamSize.max) {
        return sendError(res, 400, 'Team size min and max are required for team events.');
      }
      
      if (eventData.teamSize.min > eventData.teamSize.max) {
        return sendError(res, 400, 'Team size minimum cannot be greater than maximum.');
      }
    }
    
    const event = await Event.create(eventData);
    
    sendSuccess(res, 201, 'Event created successfully!', { event });
  } catch (error) {
    console.error('Create event error:', error);
    sendError(res, 500, 'Failed to create event.', error.message);
  }
};

/**
 * Get all events created by organizer
 * GET /api/organizer/events
 */
const getOrganizerEvents = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { organizer: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Event.countDocuments(query)
    ]);
    
    sendSuccess(res, 200, 'Events retrieved successfully.', {
      events,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get organizer events error:', error);
    sendError(res, 500, 'Failed to retrieve events.');
  }
};

/**
 * Get single event details (organizer view)
 * GET /api/organizer/events/:id
 */
const getOrganizerEventDetails = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id
    });
    
    if (!event) {
      return sendError(res, 404, 'Event not found or you do not have access.');
    }
    
    // Get registration statistics
    const stats = await Registration.getEventStats(event._id);
    
    // Get revenue data (for paid events)
    let revenueStats = null;
    if (event.registrationFee > 0 || event.eventType === 'Merchandise') {
      const payments = await Registration.aggregate([
        { $match: { event: event._id, 'payment.required': true } },
        {
          $group: {
            _id: '$payment.status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$payment.amount' }
          }
        }
      ]);
      
      revenueStats = {
        pending: 0,
        approved: 0,
        total: 0
      };
      
      payments.forEach(p => {
        if (p._id === 'Approved' || p._id === 'Completed') {
          revenueStats.approved = p.totalAmount;
        } else if (p._id === 'Pending') {
          revenueStats.pending = p.totalAmount;
        }
        revenueStats.total += p.totalAmount;
      });
    }
    
    sendSuccess(res, 200, 'Event details retrieved successfully.', {
      event,
      statistics: stats,
      revenue: revenueStats
    });
  } catch (error) {
    console.error('Get organizer event details error:', error);
    sendError(res, 500, 'Failed to retrieve event details.');
  }
};

/**
 * Update event
 * PUT /api/organizer/events/:id
 */
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id
    });
    
    if (!event) {
      return sendError(res, 404, 'Event not found or you do not have access.');
    }
    
    // Restrict certain updates after event is published with registrations
    if (event.status === 'Published' && event.currentRegistrations > 0) {
      const restrictedFields = ['registrationLimit', 'registrationFee', 'eventType', 'customRegistrationForm']; // Locked fields
      const hasRestrictedUpdates = restrictedFields.some(field => req.body[field] !== undefined);
      
      if (hasRestrictedUpdates) {
        return sendError(res, 400, 'Cannot modify core event details or registration form after participants have registered.');
      }
    }
    
    // Update event
    Object.assign(event, req.body);
    await event.save();
    
    sendSuccess(res, 200, 'Event updated successfully!', { event });
  } catch (error) {
    console.error('Update event error:', error);
    sendError(res, 500, 'Failed to update event.');
  }
};

/**
 * Delete event (only if no registrations or in draft)
 * DELETE /api/organizer/events/:id
 */
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id
    });
    
    if (!event) {
      return sendError(res, 404, 'Event not found or you do not have access.');
    }
    
    // Check if event has registrations
    if (event.currentRegistrations > 0) {
      return sendError(res, 400, 'Cannot delete event with existing registrations. Please cancel the event instead.');
    }
    
    await Event.findByIdAndDelete(event._id);
    
    sendSuccess(res, 200, 'Event deleted successfully.');
  } catch (error) {
    console.error('Delete event error:', error);
    sendError(res, 500, 'Failed to delete event.');
  }
};

/**
 * Publish event (change status from Draft to Published)
 * POST /api/organizer/events/:id/publish
 */
const publishEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id
    }).populate('organizer');
    
    if (!event) {
      return sendError(res, 404, 'Event not found or you do not have access.');
    }
    
    if (event.status !== 'Draft') {
      return sendError(res, 400, 'Only draft events can be published.');
    }
    
    event.status = 'Published';
    await event.save();

    // Send Discord Notification (async)
    notifyDiscord(event).catch(err => console.error('Discord notification failed:', err));
    
    sendSuccess(res, 200, 'Event published successfully!', { event });
  } catch (error) {
    console.error('Publish event error:', error);
    sendError(res, 500, 'Failed to publish event.');
  }
};

/**
 * Get event registrations/participants
 * GET /api/organizer/events/:id/registrations
 */
const getEventRegistrations = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, search = '', page = 1, limit = 50 } = req.query;
    
    // Verify organizer owns this event
    const event = await Event.findOne({
      _id: id,
      organizer: req.user._id
    });
    
    if (!event) {
      return sendError(res, 404, 'Event not found or you do not have access.');
    }
    
    const query = { event: id };
    
    if (status) {
      query.status = status;
    }
    
    const registrations = await Registration.find(query)
      .populate('participant', 'firstName lastName email participantType college contactNumber')
      .sort({ registeredAt: -1 })
      .lean();
    
    // Apply search filter if provided
    let filteredRegistrations = registrations;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRegistrations = registrations.filter(reg => {
        const participant = reg.participant;
        return (
          participant.firstName.toLowerCase().includes(searchLower) ||
          participant.lastName.toLowerCase().includes(searchLower) ||
          participant.email.toLowerCase().includes(searchLower) ||
          reg.ticketId.toLowerCase().includes(searchLower)
        );
      });
    }
    
    sendSuccess(res, 200, 'Registrations retrieved successfully.', {
      registrations: filteredRegistrations,
      count: filteredRegistrations.length
    });
  } catch (error) {
    console.error('Get event registrations error:', error);
    sendError(res, 500, 'Failed to retrieve registrations.');
  }
};

/**
 * Mark attendance for a participant
 * POST /api/organizer/events/:eventId/attendance/:registrationId
 */
const markAttendance = async (req, res) => {
  try {
    const { eventId, registrationId } = req.params;
    
    // Verify organizer owns this event
    const event = await Event.findOne({
      _id: eventId,
      organizer: req.user._id
    });
    
    if (!event) {
      return sendError(res, 404, 'Event not found or you do not have access.');
    }
    
    const registration = await Registration.findOne({
      _id: registrationId,
      event: eventId
    });
    
    if (!registration) {
      return sendError(res, 404, 'Registration not found.');
    }
    
    if (registration.attendance.marked) {
      return sendError(res, 400, 'Attendance already marked for this participant.');
    }
    
    await registration.markAttendance(req.user._id);
    
    sendSuccess(res, 200, 'Attendance marked successfully.');
  } catch (error) {
    console.error('Mark attendance error:', error);
    sendError(res, 500, 'Failed to mark attendance.');
  }
};

const QRCode = require('qrcode');
const crypto = require('crypto');
const { sendTicketEmail, sendMerchandiseConfirmation } = require('../utils/emailService');

// ... imports

/**
 * Approve or reject payment
 * PUT /api/organizer/registrations/:registrationId/payment
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { status } = req.body; // status: 'Approved' or 'Rejected'
    
    if (!['Approved', 'Rejected'].includes(status)) {
      return sendError(res, 400, 'Invalid payment status. Must be Approved or Rejected.');
    }
    
    const registration = await Registration.findById(registrationId)
      .populate('event')
      .populate('participant', 'firstName lastName email'); // Populate for email
    
    if (!registration) {
      return sendError(res, 404, 'Registration not found.');
    }
    
    // Verify organizer owns this event
    if (registration.event.organizer.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'You do not have access to this registration.');
    }
    
    // Check if payment required (some registrations might be free but this endpoint is for payment approvals)
    if (!registration.payment || !registration.payment.required) {
       // Allow manual approval if it was stuck?
       // Let's stick to requirement: only if required.
       // But what if it was 'Pending' due to team but not payment?
       // This function is specifically updatePaymentStatus.
       if (!registration.payment) {
          return sendError(res, 400, 'This registration does not have payment details.');
       }
    }
    
    registration.payment.status = status;
    
    if (status === 'Approved') {
      registration.payment.paidAt = new Date();
      
      // Decrement Merchandise Stock
      if (registration.event.eventType === 'Merchandise' && registration.merchandisePurchase && registration.merchandisePurchase.items) {
          const eventDoc = await Event.findById(registration.event._id); // Re-fetch to ensure we have latest and can save
          
          if (eventDoc && eventDoc.merchandiseDetails && eventDoc.merchandiseDetails.items) {
              let possible = true;
              // First check stock
              for (const purchasedItem of registration.merchandisePurchase.items) {
                  const merchItem = eventDoc.merchandiseDetails.items.find(i => i._id.toString() === purchasedItem.itemId);
                  if (!merchItem || merchItem.stockQuantity < purchasedItem.quantity) {
                      possible = false;
                      break;
                  }
              }
              
              if (!possible) {
                  return sendError(res, 400, 'Insufficient stock to approve this order.');
              }
              
              // Then decrement
              for (const purchasedItem of registration.merchandisePurchase.items) {
                  const merchItem = eventDoc.merchandiseDetails.items.find(i => i._id.toString() === purchasedItem.itemId);
                  if (merchItem) {
                      merchItem.stockQuantity -= purchasedItem.quantity;
                  }
                  
                  // Ensure name and price exist for email (backward compatibility)
                  if (!purchasedItem.name && merchItem) purchasedItem.name = merchItem.name;
                  if (!purchasedItem.price && merchItem) purchasedItem.price = merchItem.price;
              }
              await eventDoc.save();
          }
      }

      // Logic for Status Update
      let shouldConfirm = true;
      
      if (registration.isTeamRegistration) {
          const currentSize = (registration.team.teamMembers.length || 0) + 1;
          const target = registration.team.targetTeamSize || registration.event.maxTeamSize || 1;
          
          if (currentSize < target) {
              shouldConfirm = false; // Still pending team completion
          }
      }
      
      if (shouldConfirm) {
          registration.status = 'Confirmed';
          
          // Generate Ticket & QR if not already present
          // If we want to replace TKT- with FEL- upon confirmation:
          if (!registration.ticketId || (registration.ticketId && registration.ticketId.startsWith('TKT-'))) {
              const ticketId = `FEL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
              registration.ticketId = ticketId;
          }
          
          if (!registration.qrCode && registration.ticketId) {
              try {
                  const qrCodeData = await QRCode.toDataURL(registration.ticketId);
                  registration.qrCode = qrCodeData;
              } catch (e) { console.error("QR Fail", e); }
          }
          
          // Send Emails
          if (registration.event.eventType === 'Merchandise') {
             sendMerchandiseConfirmation(registration.participant, registration.event, registration).catch(console.error);
          } else {
             sendTicketEmail(registration.participant, registration.event, registration).catch(console.error);
             
             if (registration.isTeamRegistration && registration.team.teamMembers) {
                 for (const member of registration.team.teamMembers) {
                     const mUser = { firstName: member.name, email: member.email };
                     sendTicketEmail(mUser, registration.event, registration).catch(console.error);
                 }
             }
          }
      }
      // If team not full, status remains 'Pending' (but payment is Approved)

    } else {
      registration.status = 'Cancelled';
      // Decrement event registration count
      await registration.event.decrementRegistrations();
    }
    
    await registration.save();
    
    sendSuccess(res, 200, `Payment ${status.toLowerCase()} successfully.`);
  } catch (error) {
    console.error('Update payment status error:', error);
    sendError(res, 500, 'Failed to update payment status.');
  }
};

/**
 * Get event analytics
 * GET /api/organizer/events/:id/analytics
 */
const getEventAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify organizer owns this event
    const event = await Event.findOne({
      _id: id,
      organizer: req.user._id
    });
    
    if (!event) {
      return sendError(res, 404, 'Event not found or you do not have access.');
    }
    
    // Get registration stats
    const registrationStats = await Registration.getEventStats(id);
    
    // Get participant type distribution
    const participantTypeStats = await Registration.aggregate([
      { $match: { event: event._id } },
      {
        $lookup: {
          from: 'users',
          localField: 'participant',
          foreignField: '_id',
          as: 'participantDetails'
        }
      },
      { $unwind: '$participantDetails' },
      {
        $group: {
          _id: '$participantDetails.participantType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get attendance stats
    const attendanceRaw = await Registration.aggregate([
      { $match: { event: event._id } },
      {
        $group: {
          _id: '$attendance.marked',
          count: { $sum: 1 }
        }
      }
    ]);

    const attendanceStats = {
      present: 0,
      absent: 0
    };

    attendanceRaw.forEach(stat => {
      if (stat._id === true) attendanceStats.present = stat.count;
      else attendanceStats.absent = stat.count;
    });
    
    // Get revenue stats
    const revenueStats = await Registration.aggregate([
      { 
        $match: { 
          event: event._id,
          status: 'Confirmed'
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payment.amount' }
        }
      }
    ]);

    const revenueTotal = revenueStats.length > 0 ? revenueStats[0].total : 0;

    // Get feedback stats
    const feedbackStats = await Feedback.getEventAverageRating(id);
    
    sendSuccess(res, 200, 'Analytics retrieved successfully.', {
      event: {
        name: event.eventName,
        views: event.views,
        registrationLimit: event.registrationLimit
      },
      registrations: registrationStats,
      participantTypes: participantTypeStats,
      attendance: attendanceStats,
      revenue: { total: revenueTotal || 0 }, // Using payment amount if available, or fallback to fee * confirmed
      feedback: feedbackStats
    });
  } catch (error) {
    console.error('Get event analytics error:', error);
    sendError(res, 500, 'Failed to retrieve analytics.');
  }
};

/**
 * Export registrations as CSV data
 * GET /api/organizer/events/:id/export
 */
const exportRegistrations = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify organizer owns this event
    const event = await Event.findOne({
      _id: id,
      organizer: req.user._id
    });
    
    if (!event) {
      return sendError(res, 404, 'Event not found or you do not have access.');
    }
    
    const registrations = await Registration.find({ event: id })
      .populate('participant', 'firstName lastName email participantType college contactNumber')
      .lean();
    
    // Format data for CSV
    const csvData = registrations.map(reg => ({
      ticketId: reg.ticketId,
      name: `${reg.participant.firstName} ${reg.participant.lastName}`,
      email: reg.participant.email,
      participantType: reg.participant.participantType,
      college: reg.participant.college || '',
      contactNumber: reg.participant.contactNumber || '',
      status: reg.status,
      registeredAt: new Date(reg.registeredAt).toLocaleString(),
      attendanceMarked: reg.attendance.marked ? 'Yes' : 'No'
    }));
    
    sendSuccess(res, 200, 'Export data generated successfully.', {
      data: csvData
    });
  } catch (error) {
    console.error('Export registrations error:', error);
    sendError(res, 500, 'Failed to export registrations.');
  }
};

module.exports = {
  createEvent,
  getOrganizerEvents,
  getOrganizerDashboardStats,
  getOrganizerEventDetails,
  updateEvent,
  deleteEvent,
  publishEvent,
  getEventRegistrations,
  markAttendance,
  updatePaymentStatus,
  getEventAnalytics,
  exportRegistrations
};
