const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { sendSuccess, sendError } = require('../utils/helpers');

/**
 * Submit feedback for an event
 * POST /api/feedback/:eventId
 */
const submitFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment, isAnonymous = false } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return sendError(res, 400, 'Rating must be between 1 and 5.');
    }
    
    // Check if event exists and has ended
    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 404, 'Event not found.');
    }
    
    // Only allow feedback after event has ended
    if (new Date() < new Date(event.eventEndDate)) {
      return sendError(res, 400, 'Feedback can only be submitted after the event has ended.');
    }
    
    // Check if user attended the event
    const registration = await Registration.findOne({
      event: eventId,
      participant: req.user._id,
      status: 'Confirmed'
    });
    
    if (!registration) {
      return sendError(res, 403, 'Only participants who attended the event can submit feedback.');
    }
    
    // Check if feedback already submitted
    const existingFeedback = await Feedback.findOne({
      event: eventId,
      participant: req.user._id
    });
    
    if (existingFeedback) {
      return sendError(res, 400, 'You have already submitted feedback for this event.');
    }
    
    const feedback = await Feedback.create({
      event: eventId,
      participant: req.user._id,
      rating,
      comment: comment || '',
      isAnonymous
    });
    
    sendSuccess(res, 201, 'Thank you for your feedback!', {
      feedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    sendError(res, 500, 'Failed to submit feedback.');
  }
};

/**
 * Get feedback for an event
 * GET /api/feedback/:eventId
 */
const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 404, 'Event not found.');
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get feedback
    const feedbacks = await Feedback.find({ event: eventId })
      .populate('participant', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Hide participant details for anonymous feedback
    const sanitizedFeedbacks = feedbacks.map(fb => {
      if (fb.isAnonymous) {
        return {
          ...fb,
          participant: { firstName: 'Anonymous', lastName: '' }
        };
      }
      return fb;
    });
    
    // Get average rating and statistics
    const stats = await Feedback.getEventAverageRating(eventId);
    
    sendSuccess(res, 200, 'Feedback retrieved successfully.', {
      feedbacks: sanitizedFeedbacks,
      statistics: stats
    });
  } catch (error) {
    console.error('Get event feedback error:', error);
    sendError(res, 500, 'Failed to retrieve feedback.');
  }
};

module.exports = {
  submitFeedback,
  getEventFeedback
};
