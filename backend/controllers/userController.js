const PasswordResetRequest = require('../models/PasswordResetRequest');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { sendSuccess, sendError } = require('../utils/helpers');

/**
 * Get participant dashboard statistics
 * GET /api/users/dashboard
 */
const getParticipantDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // 1. Get all registrations for this user with event details
    const registrations = await Registration.find({
      $or: [
        { participant: userId },
        { 'team.teamMembers.userId': userId }
      ]
    })
      .populate('event')
      .lean();

    // 2. Calculate stats
    const totalRegistrations = registrations.length;
    
    const upcomingRegistrations = registrations.filter(reg => 
      reg.event && new Date(reg.event.eventStartDate) > now
    );
    
    const completedRegistrations = registrations.filter(reg => 
      reg.event && new Date(reg.event.eventEndDate) <= now
    );

    // 3. Get upcoming events list (limit 5)
    // Sort by start date ascending
    upcomingRegistrations.sort((a, b) => 
      new Date(a.event.eventStartDate) - new Date(b.event.eventStartDate)
    );
    
    const upcomingEventsList = upcomingRegistrations.slice(0, 5).map(reg => reg.event);

    // 4. Get recommended events based on interests
    const user = await User.findById(userId);
    let recommendedEvents = [];
    
    if (user.areasOfInterest && user.areasOfInterest.length > 0) {
      recommendedEvents = await Event.find({
        status: { $in: ['Published', 'Ongoing'] },
        eventStartDate: { $gte: now },
        eventTags: { $in: user.areasOfInterest },
        _id: { $nin: registrations.map(r => r.event._id) } // Exclude registered events
      })
      .limit(5)
      .lean();
    }
    
    // If no interests or no matches, get popular/upcoming events
    if (recommendedEvents.length === 0) {
      recommendedEvents = await Event.find({
        status: { $in: ['Published', 'Ongoing'] },
        eventStartDate: { $gte: now },
        _id: { $nin: registrations.map(r => r.event._id) }
      })
      .sort({ eventStartDate: 1 })
      .limit(5)
      .lean();
    }

    sendSuccess(res, 200, 'Dashboard stats retrieved successfully.', {
      stats: {
        total: totalRegistrations,
        upcoming: upcomingRegistrations.length,
        completed: completedRegistrations.length
      },
      upcomingEvents: upcomingEventsList,
      recommendedEvents
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    sendError(res, 500, 'Failed to retrieve dashboard stats.');
  }
};

/**
 * Submit password reset request (organizer only)
 * POST /api/password-reset/request
 */
const submitPasswordResetRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim().length < 10) {
      return sendError(res, 400, 'Please provide a detailed reason (at least 10 characters).');
    }
    
    if (req.user.role !== 'organizer') {
      return sendError(res, 403, 'Only organizers can request password resets through this system.');
    }
    
    // Check for pending requests
    const pendingRequest = await PasswordResetRequest.findOne({
      organizer: req.user._id,
      status: 'Pending'
    });
    
    if (pendingRequest) {
      return sendError(res, 400, 'You already have a pending password reset request. Please wait for admin review.');
    }
    
    const request = await PasswordResetRequest.create({
      organizer: req.user._id,
      reason: reason.trim()
    });
    
    sendSuccess(res, 201, 'Password reset request submitted successfully. An admin will review it shortly.', {
      request
    });
  } catch (error) {
    console.error('Submit password reset request error:', error);
    sendError(res, 500, 'Failed to submit password reset request.');
  }
};

/**
 * Get my password reset requests (organizer only)
 * GET /api/password-reset/my-requests
 */
const getMyPasswordResetRequests = async (req, res) => {
  try {
    if (req.user.role !== 'organizer') {
      return sendError(res, 403, 'Only organizers can access this resource.');
    }
    
    const requests = await PasswordResetRequest.find({
      organizer: req.user._id
    })
      .populate('reviewedBy', 'email')
      .sort({ requestedAt: -1 });
    
    sendSuccess(res, 200, 'Password reset requests retrieved successfully.', {
      requests
    });
  } catch (error) {
    console.error('Get my password reset requests error:', error);
    sendError(res, 500, 'Failed to retrieve password reset requests.');
  }
};

/**
 * Follow/Unfollow a club/organizer (participant only)
 * POST /api/users/follow/:organizerId
 */
const toggleFollowOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    
    if (req.user.role !== 'participant') {
      return sendError(res, 403, 'Only participants can follow organizers.');
    }
    
    // Check if organizer exists
    const organizer = await User.findOne({
      _id: organizerId,
      role: 'organizer',
      isApproved: true
    });
    
    if (!organizer) {
      return sendError(res, 404, 'Organizer not found or not approved.');
    }
    
    const user = await User.findById(req.user._id);
    
    // Check if already following
    const isFollowing = user.clubsToFollow.includes(organizerId);
    
    if (isFollowing) {
      // Unfollow
      user.clubsToFollow = user.clubsToFollow.filter(
        id => id.toString() !== organizerId
      );
    } else {
      // Follow
      user.clubsToFollow.push(organizerId);
    }
    
    await user.save();
    
    sendSuccess(res, 200, isFollowing ? 'Unfollowed successfully.' : 'Followed successfully!', {
      isFollowing: !isFollowing
    });
  } catch (error) {
    console.error('Toggle follow organizer error:', error);
    sendError(res, 500, 'Failed to update follow status.');
  }
};

/**
 * Get list of all approved organizers/clubs
 * GET /api/users/organizers
 */
const getOrganizers = async (req, res) => {
  try {
    const { category, search = '' } = req.query;
    
    const query = {
      role: 'organizer',
      isApproved: true
    };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.organizerName = { $regex: search, $options: 'i' };
    }
    
    const organizers = await User.find(query)
      .select('organizerName category description contactEmail')
      .sort({ organizerName: 1 });
    
    sendSuccess(res, 200, 'Organizers retrieved successfully.', {
      organizers
    });
  } catch (error) {
    console.error('Get organizers error:', error);
    sendError(res, 500, 'Failed to retrieve organizers.');
  }
};

/**
 * Get organizer profile (public view)
 * GET /api/users/organizers/:id
 */
const getOrganizerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const organizer = await User.findOne({
      _id: id,
      role: 'organizer',
      isApproved: true
    }).select('organizerName category description contactEmail');
    
    if (!organizer) {
      return sendError(res, 404, 'Organizer not found.');
    }
    
    // Get organizer's upcoming events
    const events = await Event.find({
      organizer: id,
      status: 'Published',
      eventStartDate: { $gte: new Date() }
    })
      .select('eventName eventStartDate eventEndDate eventType')
      .sort({ eventStartDate: 1 })
      .limit(10);
    
    // Get past events count
    const pastEventsCount = await Event.countDocuments({
      organizer: id,
      status: { $in: ['Published', 'Completed'] },
      eventEndDate: { $lt: new Date() }
    });
    
    sendSuccess(res, 200, 'Organizer profile retrieved successfully.', {
      organizer,
      upcomingEvents: events,
      pastEventsCount
    });
  } catch (error) {
    console.error('Get organizer profile error:', error);
    sendError(res, 500, 'Failed to retrieve organizer profile.');
  }
};

module.exports = {
  getParticipantDashboardStats,
  submitPasswordResetRequest,
  getMyPasswordResetRequests,
  toggleFollowOrganizer,
  getOrganizers,
  getOrganizerProfile
};
