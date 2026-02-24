const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const { 
  sendSuccess, 
  sendError, 
  generateRandomPassword, 
  generateToken 
} = require('../utils/helpers');

/**
 * Create new organizer account
 * POST /api/admin/organizers
 */
const createOrganizer = async (req, res) => {
  try {
    const { email, organizerName, category, description, contactEmail } = req.body;
    
    // Check if organizer already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return sendError(res, 400, 'Email already registered.');
    }
    
    // Generate random password
    const password = generateRandomPassword();
    
    // Create organizer
    const organizer = await User.create({
      email,
      password,
      role: 'organizer',
      organizerName,
      category,
      description,
      contactEmail: contactEmail || email,
      isApproved: true // Auto-approved when created by admin
    });
    
    sendSuccess(res, 201, 'Organizer created successfully!', {
      organizer: organizer.getPublicProfile(),
      temporaryPassword: password,
      message: 'Share these credentials with the organizer. They can change the password after first login.'
    });
  } catch (error) {
    console.error('Create organizer error:', error);
    sendError(res, 500, 'Failed to create organizer.');
  }
};

/**
 * Get all organizers
 * GET /api/admin/organizers
 */
const getAllOrganizers = async (req, res) => {
  try {
    const { isApproved, category } = req.query;
    
    const query = { role: 'organizer' };
    
    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }
    
    if (category) {
      query.category = category;
    }
    
    const organizers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });
    
    sendSuccess(res, 200, 'Organizers retrieved successfully.', {
      organizers
    });
  } catch (error) {
    console.error('Get all organizers error:', error);
    sendError(res, 500, 'Failed to retrieve organizers.');
  }
};

/**
 * Update organizer details
 * PUT /api/admin/organizers/:id
 */
const updateOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Prevent updating certain fields
    delete updates.password;
    delete updates.role;
    delete updates.email;
    
    const organizer = await User.findOneAndUpdate(
      { _id: id, role: 'organizer' },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!organizer) {
      return sendError(res, 404, 'Organizer not found.');
    }
    
    sendSuccess(res, 200, 'Organizer updated successfully!', {
      organizer
    });
  } catch (error) {
    console.error('Update organizer error:', error);
    sendError(res, 500, 'Failed to update organizer.');
  }
};

/**
 * Delete/Remove organizer
 * DELETE /api/admin/organizers/:id
 */
const deleteOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if organizer has any events
    const eventCount = await Event.countDocuments({ organizer: id });
    
    if (eventCount > 0) {
      return sendError(res, 400, 'Cannot delete organizer with existing events. Please delete or reassign events first.');
    }
    
    const organizer = await User.findOneAndDelete({
      _id: id,
      role: 'organizer'
    });
    
    if (!organizer) {
      return sendError(res, 404, 'Organizer not found.');
    }
    
    sendSuccess(res, 200, 'Organizer deleted successfully.');
  } catch (error) {
    console.error('Delete organizer error:', error);
    sendError(res, 500, 'Failed to delete organizer.');
  }
};

/**
 * Get all password reset requests
 * GET /api/admin/password-requests
 */
const getPasswordResetRequests = async (req, res) => {
  try {
    const { status = 'Pending' } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const requests = await PasswordResetRequest.find(query)
      .populate('organizer', 'organizerName email category')
      .populate('reviewedBy', 'email')
      .sort({ requestedAt: -1 });
    
    sendSuccess(res, 200, 'Password reset requests retrieved successfully.', {
      requests
    });
  } catch (error) {
    console.error('Get password reset requests error:', error);
    sendError(res, 500, 'Failed to retrieve password reset requests.');
  }
};

/**
 * Approve password reset request
 * POST /api/admin/password-requests/:id/approve
 */
const approvePasswordReset = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComments } = req.body;
    
    const request = await PasswordResetRequest.findById(id)
      .populate('organizer');
    
    if (!request) {
      return sendError(res, 404, 'Password reset request not found.');
    }
    
    if (request.status !== 'Pending') {
      return sendError(res, 400, 'This request has already been processed.');
    }
    
    // Generate new password
    const newPassword = generateRandomPassword();
    
    // Update organizer password
    const organizer = await User.findById(request.organizer._id);
    organizer.password = newPassword;
    await organizer.save();
    
    // Update request
    request.status = 'Approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.adminComments = adminComments;
    request.newPassword = newPassword; // Store temporarily
    await request.save();
    
    sendSuccess(res, 200, 'Password reset approved successfully!', {
      newPassword,
      message: 'Share this password with the organizer securely.'
    });
  } catch (error) {
    console.error('Approve password reset error:', error);
    sendError(res, 500, 'Failed to approve password reset.');
  }
};

/**
 * Reject password reset request
 * POST /api/admin/password-requests/:id/reject
 */
const rejectPasswordReset = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComments } = req.body;
    
    const request = await PasswordResetRequest.findById(id);
    
    if (!request) {
      return sendError(res, 404, 'Password reset request not found.');
    }
    
    if (request.status !== 'Pending') {
      return sendError(res, 400, 'This request has already been processed.');
    }
    
    request.status = 'Rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.adminComments = adminComments || 'Request rejected';
    await request.save();
    
    sendSuccess(res, 200, 'Password reset request rejected.');
  } catch (error) {
    console.error('Reject password reset error:', error);
    sendError(res, 500, 'Failed to reject password reset.');
  }
};

/**
 * Get system statistics
 * GET /api/admin/statistics
 */
const getSystemStatistics = async (req, res) => {
  try {
    // Get counts
    const [
      totalParticipants,
      totalOrganizers,
      totalEvents,
      totalRegistrations,
      iiitParticipants,
      nonIiitParticipants,
      publishedEvents,
      upcomingEvents
    ] = await Promise.all([
      User.countDocuments({ role: 'participant' }),
      User.countDocuments({ role: 'organizer' }),
      Event.countDocuments(),
      Registration.countDocuments(),
      User.countDocuments({ role: 'participant', participantType: 'IIIT' }),
      User.countDocuments({ role: 'participant', participantType: 'Non-IIIT' }),
      Event.countDocuments({ status: 'Published' }),
      Event.countDocuments({ 
        status: 'Published',
        eventStartDate: { $gte: new Date() }
      })
    ]);
    
    // Get recent activities
    const recentEvents = await Event.find()
      .populate('organizer', 'organizerName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    const recentRegistrations = await Registration.find()
      .populate('event', 'eventName')
      .populate('participant', 'firstName lastName')
      .sort({ registeredAt: -1 })
      .limit(10)
      .lean();
    
    sendSuccess(res, 200, 'Statistics retrieved successfully.', {
      users: {
        totalParticipants,
        iiitParticipants,
        nonIiitParticipants,
        totalOrganizers
      },
      events: {
        total: totalEvents,
        published: publishedEvents,
        upcoming: upcomingEvents
      },
      registrations: {
        total: totalRegistrations
      },
      recent: {
        events: recentEvents,
        registrations: recentRegistrations
      }
    });
  } catch (error) {
    console.error('Get system statistics error:', error);
    sendError(res, 500, 'Failed to retrieve statistics.');
  }
};

/**
 * Get all participants
 * GET /api/admin/participants
 */
const getAllParticipants = async (req, res) => {
  try {
    const { participantType, search = '', page = 1, limit = 50 } = req.query;
    
    const query = { role: 'participant' };
    
    if (participantType) {
      query.participantType = participantType;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const [participants, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);
    
    sendSuccess(res, 200, 'Participants retrieved successfully.', {
      participants,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get all participants error:', error);
    sendError(res, 500, 'Failed to retrieve participants.');
  }
};

/**
 * Get all events (admin view)
 * GET /api/admin/events
 */
const getAllEventsAdmin = async (req, res) => {
  try {
    const { status, organizer, page = 1, limit = 50 } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (organizer) {
      query.organizer = organizer;
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('organizer', 'organizerName category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
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
    console.error('Get all events admin error:', error);
    sendError(res, 500, 'Failed to retrieve events.');
  }
};

module.exports = {
  createOrganizer,
  getAllOrganizers,
  updateOrganizer,
  deleteOrganizer,
  getPasswordResetRequests,
  approvePasswordReset,
  rejectPasswordReset,
  getSystemStatistics,
  getAllParticipants,
  getAllEventsAdmin
};

