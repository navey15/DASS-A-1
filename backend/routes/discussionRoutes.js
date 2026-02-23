const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');
const { authenticate } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

/**
 * @route   GET /api/discussions/:eventId
 * @desc    Get all discussions for an event
 * @access  Public
 */
router.get('/:eventId', validateObjectId('eventId'), discussionController.getEventDiscussions);

/**
 * @route   POST /api/discussions/:eventId
 * @desc    Post a new message in discussion forum
 * @access  Private (Registered participants and event organizers)
 */
router.post('/:eventId', authenticate, validateObjectId('eventId'), discussionController.postDiscussion);

/**
 * @route   POST /api/discussions/:discussionId/reply
 * @desc    Reply to a discussion
 * @access  Private (Registered participants and event organizers)
 */
router.post('/:discussionId/reply', authenticate, validateObjectId('discussionId'), discussionController.replyToDiscussion);

/**
 * @route   PUT /api/discussions/:discussionId/pin
 * @desc    Pin/Unpin a discussion
 * @access  Private (Event organizers only)
 */
router.put('/:discussionId/pin', authenticate, validateObjectId('discussionId'), discussionController.togglePinDiscussion);

/**
 * @route   DELETE /api/discussions/:discussionId
 * @desc    Delete a discussion
 * @access  Private (Author or event organizer)
 */
router.delete('/:discussionId', authenticate, validateObjectId('discussionId'), discussionController.deleteDiscussion);

module.exports = router;
