const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * @route   GET /api/events
 * @desc    Get all events with filtering and search
 * @access  Public (with optional auth for personalized results)
 */
router.get('/', optionalAuth, eventController.getAllEvents);

/**
 * @route   GET /api/events/trending
 * @desc    Get trending/popular events
 * @access  Public
 */
router.get('/trending', eventController.getTrendingEvents);

/**
 * @route   GET /api/events/followed
 * @desc    Get events from followed clubs
 * @access  Private (Participants only)
 */
router.get('/followed', authenticate, eventController.getFollowedClubsEvents);

/**
 * @route   GET /api/events/recommended
 * @desc    Get recommended events based on interests
 * @access  Private (Participants only)
 */
router.get('/recommended', authenticate, eventController.getRecommendedEvents);

/**
 * @route   GET /api/events/:id
 * @desc    Get single event by ID
 * @access  Public (with optional auth for registration status)
 */
router.get('/:id', optionalAuth, eventController.getEventById);

module.exports = router;
