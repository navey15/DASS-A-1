const Discussion = require('../models/Discussion');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { sendSuccess, sendError } = require('../utils/helpers');

/**
 * Get all discussions for an event
 * GET /api/discussions/:eventId
 */
const getEventDiscussions = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 404, 'Event not found.');
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const discussions = await Discussion.find({ event: eventId })
      .populate('author', 'firstName lastName organizerName role')
      .populate('replies.author', 'firstName lastName organizerName role')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    sendSuccess(res, 200, 'Discussions retrieved successfully.', {
      discussions
    });
  } catch (error) {
    console.error('Get event discussions error:', error);
    sendError(res, 500, 'Failed to retrieve discussions.');
  }
};

/**
 * Post a new message in discussion forum
 * POST /api/discussions/:eventId
 */
const postDiscussion = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message, messageType = 'general' } = req.body;
    
    if (!message || message.trim().length === 0) {
      return sendError(res, 400, 'Message cannot be empty.');
    }
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 404, 'Event not found.');
    }
    
    // Check if user is registered or is the organizer
    const isOrganizer = req.user.role === 'organizer' && 
                       event.organizer.toString() === req.user._id.toString();
    
    let isRegistered = false;
    if (req.user.role === 'participant') {
      const registration = await Registration.findOne({
        event: eventId,
        participant: req.user._id,
        status: { $in: ['Confirmed', 'Pending'] }
      });
      isRegistered = !!registration;
    }
    
    if (!isOrganizer && !isRegistered) {
      return sendError(res, 403, 'Only registered participants and event organizers can post in discussions.');
    }
    
    const discussion = await Discussion.create({
      event: eventId,
      author: req.user._id,
      message: message.trim(),
      messageType,
      isOrganizerPost: isOrganizer
    });
    
    const populatedDiscussion = await Discussion.findById(discussion._id)
      .populate('author', 'firstName lastName organizerName role');
    
    sendSuccess(res, 201, 'Message posted successfully!', {
      discussion: populatedDiscussion
    });
  } catch (error) {
    console.error('Post discussion error:', error);
    sendError(res, 500, 'Failed to post message.');
  }
};

/**
 * Reply to a discussion
 * POST /api/discussions/:discussionId/reply
 */
const replyToDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return sendError(res, 400, 'Reply message cannot be empty.');
    }
    
    const discussion = await Discussion.findById(discussionId)
      .populate('event');
    
    if (!discussion) {
      return sendError(res, 404, 'Discussion not found.');
    }
    
    // Check if user is registered or is the organizer
    const isOrganizer = req.user.role === 'organizer' && 
                       discussion.event.organizer.toString() === req.user._id.toString();
    
    let isRegistered = false;
    if (req.user.role === 'participant') {
      const registration = await Registration.findOne({
        event: discussion.event._id,
        participant: req.user._id,
        status: { $in: ['Confirmed', 'Pending'] }
      });
      isRegistered = !!registration;
    }
    
    if (!isOrganizer && !isRegistered) {
      return sendError(res, 403, 'Only registered participants and event organizers can reply.');
    }
    
    discussion.replies.push({
      author: req.user._id,
      message: message.trim()
    });
    
    await discussion.save();
    
    const updatedDiscussion = await Discussion.findById(discussionId)
      .populate('author', 'firstName lastName organizerName role')
      .populate('replies.author', 'firstName lastName organizerName role');
    
    sendSuccess(res, 200, 'Reply posted successfully!', {
      discussion: updatedDiscussion
    });
  } catch (error) {
    console.error('Reply to discussion error:', error);
    sendError(res, 500, 'Failed to post reply.');
  }
};

/**
 * Pin/Unpin discussion (organizer only)
 * PUT /api/discussions/:discussionId/pin
 */
const togglePinDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    
    const discussion = await Discussion.findById(discussionId)
      .populate('event');
    
    if (!discussion) {
      return sendError(res, 404, 'Discussion not found.');
    }
    
    // Check if user is the event organizer
    if (discussion.event.organizer.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Only event organizers can pin discussions.');
    }
    
    discussion.isPinned = !discussion.isPinned;
    await discussion.save();
    
    sendSuccess(res, 200, `Discussion ${discussion.isPinned ? 'pinned' : 'unpinned'} successfully.`);
  } catch (error) {
    console.error('Toggle pin discussion error:', error);
    sendError(res, 500, 'Failed to update discussion.');
  }
};

/**
 * Delete discussion (author or organizer only)
 * DELETE /api/discussions/:discussionId
 */
const deleteDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    
    const discussion = await Discussion.findById(discussionId)
      .populate('event');
    
    if (!discussion) {
      return sendError(res, 404, 'Discussion not found.');
    }
    
    // Check if user is author or event organizer
    const isAuthor = discussion.author.toString() === req.user._id.toString();
    const isOrganizer = discussion.event.organizer.toString() === req.user._id.toString();
    
    if (!isAuthor && !isOrganizer) {
      return sendError(res, 403, 'You can only delete your own discussions or discussions in your events.');
    }
    
    await Discussion.findByIdAndDelete(discussionId);
    
    sendSuccess(res, 200, 'Discussion deleted successfully.');
  } catch (error) {
    console.error('Delete discussion error:', error);
    sendError(res, 500, 'Failed to delete discussion.');
  }
};

module.exports = {
  getEventDiscussions,
  postDiscussion,
  replyToDiscussion,
  togglePinDiscussion,
  deleteDiscussion
};
