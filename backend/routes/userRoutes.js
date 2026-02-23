const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validatePasswordResetRequest, validateObjectId } = require('../middleware/validation');

/**
 * @route   GET /api/users/dashboard
 * @desc    Get participant dashboard stats
 * @access  Private (Participants only)
 */
router.get('/dashboard', authenticate, authorize('participant'), userController.getParticipantDashboardStats);

/**
 * @route   POST /api/users/password-reset/request
 * @desc    Submit password reset request (organizer only)
 * @access  Private (Organizers only)
 */
router.post('/password-reset/request', authenticate, authorize('organizer'), validatePasswordResetRequest, userController.submitPasswordResetRequest);

/**
 * @route   GET /api/users/password-reset/my-requests
 * @desc    Get my password reset requests
 * @access  Private (Organizers only)
 */
router.get('/password-reset/my-requests', authenticate, authorize('organizer'), userController.getMyPasswordResetRequests);

/**
 * @route   POST /api/users/follow/:organizerId
 * @desc    Follow/Unfollow a club/organizer
 * @access  Private (Participants only)
 */
router.post('/follow/:organizerId', authenticate, authorize('participant'), validateObjectId('organizerId'), userController.toggleFollowOrganizer);

/**
 * @route   GET /api/users/organizers
 * @desc    Get list of all approved organizers/clubs
 * @access  Public
 */
router.get('/organizers', userController.getOrganizers);

/**
 * @route   GET /api/users/organizers/:id
 * @desc    Get organizer profile (public view)
 * @access  Public
 */
router.get('/organizers/:id', validateObjectId('id'), userController.getOrganizerProfile);

module.exports = router;
