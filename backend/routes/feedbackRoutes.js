const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

/**
 * @route   POST /api/feedback/:eventId
 * @desc    Submit feedback for an event
 * @access  Private (Participants who attended the event)
 */
router.post('/:eventId', authenticate, authorize('participant'), validateObjectId('eventId'), feedbackController.submitFeedback);

/**
 * @route   GET /api/feedback/:eventId
 * @desc    Get feedback for an event
 * @access  Public
 */
router.get('/:eventId', validateObjectId('eventId'), feedbackController.getEventFeedback);

module.exports = router;
