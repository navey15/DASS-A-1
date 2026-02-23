const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { sendSuccess, sendError, getPaginationData } = require('../utils/helpers');

/**
 * Get all events with filtering, search, and pagination
 * GET /api/events
 */
const getAllEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      eventType,
      eligibility,
      organizer,
      status = 'Published',
      sortBy = 'eventStartDate',
      order = 'asc',
      upcoming = 'true'
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build query
    const query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { eventName: { $regex: search, $options: 'i' } },
        { eventDescription: { $regex: search, $options: 'i' } },
        { eventTags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Filter by event type
    if (eventType) {
      query.eventType = eventType;
    }
    
    // Filter by eligibility
    if (eligibility) {
      query.eligibility = eligibility;
    }
    
    // Filter by organizer
    if (organizer) {
      query.organizer = organizer;
    }
    
    // Filter upcoming events
    if (upcoming === 'true') {
      query.eventStartDate = { $gte: new Date() };
    }
    
    // Check user eligibility if authenticated
    if (req.user && req.user.role === 'participant') {
      // Filter events based on participant type
      const eligibilityFilter = [];
      eligibilityFilter.push({ eligibility: 'All' });
      
      if (req.user.participantType === 'IIIT') {
        eligibilityFilter.push({ eligibility: 'IIIT Only' });
      } else {
        eligibilityFilter.push({ eligibility: 'Non-IIIT Only' });
      }
      
      query.$and = query.$and || [];
      query.$and.push({ $or: eligibilityFilter });
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    
    // Execute query
    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('organizer', 'organizerName category description')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Event.countDocuments(query)
    ]);
    
    // Get pagination data
    const pagination = getPaginationData(pageNum, limitNum, total);
    
    sendSuccess(res, 200, 'Events retrieved successfully.', {
      events,
      pagination
    });
  } catch (error) {
    console.error('Get all events error:', error);
    sendError(res, 500, 'Failed to retrieve events.');
  }
};

/**
 * Get single event by ID
 * GET /api/events/:id
 */
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'organizerName category description contactEmail');
    
    if (!event) {
      return sendError(res, 404, 'Event not found.');
    }
    
    // Increment view count
    event.views += 1;
    await event.save();
    
    // Check if user is registered (if authenticated)
    let userRegistration = null;
    if (req.user) {
      userRegistration = await Registration.findOne({
        event: event._id,
        $or: [
          { participant: req.user._id },
          { 'team.teamMembers.userId': req.user._id }
        ]
      });
    }
    
    sendSuccess(res, 200, 'Event retrieved successfully.', {
      event,
      isRegistered: !!userRegistration,
      registrationDetails: userRegistration
    });
  } catch (error) {
    console.error('Get event by ID error:', error);
    sendError(res, 500, 'Failed to retrieve event.');
  }
};

/**
 * Get events by followed clubs (for participants)
 * GET /api/events/followed
 */
const getFollowedClubsEvents = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'participant') {
      return sendError(res, 403, 'Only participants can access this feature.');
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user.clubsToFollow || user.clubsToFollow.length === 0) {
      return sendSuccess(res, 200, 'No followed clubs yet.', { events: [] });
    }
    
    const events = await Event.find({
      organizer: { $in: user.clubsToFollow },
      status: 'Published',
      eventStartDate: { $gte: new Date() }
    })
      .populate('organizer', 'organizerName category')
      .sort({ eventStartDate: 1 })
      .limit(50);
    
    sendSuccess(res, 200, 'Followed clubs events retrieved successfully.', {
      events
    });
  } catch (error) {
    console.error('Get followed clubs events error:', error);
    sendError(res, 500, 'Failed to retrieve events.');
  }
};

/**
 * Get trending/popular events (top 24 by registration count)
 * GET /api/events/trending
 */
const getTrendingEvents = async (req, res) => {
  try {
    const events = await Event.find({
      status: 'Published',
      eventStartDate: { $gte: new Date() }
    })
      .populate('organizer', 'organizerName category')
      .sort({ currentRegistrations: -1, views: -1 })
      .limit(24)
      .lean();
    
    sendSuccess(res, 200, 'Trending events retrieved successfully.', {
      events
    });
  } catch (error) {
    console.error('Get trending events error:', error);
    sendError(res, 500, 'Failed to retrieve trending events.');
  }
};

/**
 * Get events by area of interest (for participants)
 * GET /api/events/recommended
 */
const getRecommendedEvents = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'participant') {
      return sendError(res, 403, 'Only participants can access this feature.');
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user.areasOfInterest || user.areasOfInterest.length === 0) {
      // Return popular events if no interests set
      return getTrendingEvents(req, res);
    }
    
    const events = await Event.find({
      status: 'Published',
      eventStartDate: { $gte: new Date() },
      eventTags: { $in: user.areasOfInterest }
    })
      .populate('organizer', 'organizerName category')
      .sort({ eventStartDate: 1 })
      .limit(50);
    
    sendSuccess(res, 200, 'Recommended events retrieved successfully.', {
      events
    });
  } catch (error) {
    console.error('Get recommended events error:', error);
    sendError(res, 500, 'Failed to retrieve recommended events.');
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  getFollowedClubsEvents,
  getTrendingEvents,
  getRecommendedEvents
};
