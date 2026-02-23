const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateEventRegistration } = require('../middleware/validation');
const { uploadPaymentProof, uploadRegistrationFiles } = require('../middleware/upload');

/**
 * @route   POST /api/registrations/join-team
 * @desc    Join a team using invite code
 * @access  Private (Participants only)
 */
router.post(
  '/join-team',
  authenticate,
  authorize('participant'),
  registrationController.joinTeam
);

/**
 * @route   POST /api/registrations/:eventId
 * @desc    Register for an event
 * @access  Private (Participants only)
 */
router.post(
  '/:eventId',
  authenticate,
  authorize('participant'),
  uploadRegistrationFiles.any(),
  // If we have multipart/form-data, validation needs to handle that or be skipped for file uploads
  // validateEventRegistration, 
  registrationController.registerForEvent
);

/**
 * @route   GET /api/registrations/my-events
 * @desc    Get current user's registrations
 * @access  Private (Participants only)
 */
router.get(
  '/my-events',
  authenticate,
  authorize('participant'),
  registrationController.getMyRegistrations
);

/**
 * @route   DELETE /api/registrations/:registrationId
 * @desc    Cancel a registration
 * @access  Private (Participants only)
 */
router.delete(
  '/:registrationId',
  authenticate,
  authorize('participant'),
  registrationController.cancelRegistration
);

/**
 * @route   GET /api/registrations/ticket/:ticketId
 * @desc    Get registration by ticket ID
 * @access  Private
 */
router.get(
  '/ticket/:ticketId',
  authenticate,
  registrationController.getRegistrationByTicket
);

module.exports = router;
