const express = require('express');
const router = express.Router();
const organizerController = require('../controllers/organizerController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateEventCreation, validateObjectId } = require('../middleware/validation');

// All routes require organizer authentication
router.use(authenticate);
router.use(authorize('organizer'));

/**
 * @route   GET /api/organizer/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Organizers only)
 */
router.get('/dashboard/stats', organizerController.getOrganizerDashboardStats);

/**
 * @route   POST /api/organizer/events
 * @desc    Create a new event
 * @access  Private (Organizers only)
 */
router.post('/events', validateEventCreation, organizerController.createEvent);

/**
 * @route   GET /api/organizer/events
 * @desc    Get all events created by organizer
 * @access  Private (Organizers only)
 */
router.get('/events', organizerController.getOrganizerEvents);

/**
 * @route   GET /api/organizer/events/:id
 * @desc    Get single event details with statistics
 * @access  Private (Organizers only)
 */
router.get('/events/:id', validateObjectId('id'), organizerController.getOrganizerEventDetails);

/**
 * @route   PUT /api/organizer/events/:id
 * @desc    Update event
 * @access  Private (Organizers only)
 */
router.put('/events/:id', validateObjectId('id'), organizerController.updateEvent);

/**
 * @route   DELETE /api/organizer/events/:id
 * @desc    Delete event (only if no registrations)
 * @access  Private (Organizers only)
 */
router.delete('/events/:id', validateObjectId('id'), organizerController.deleteEvent);

/**
 * @route   POST /api/organizer/events/:id/publish
 * @desc    Publish event (change from Draft to Published)
 * @access  Private (Organizers only)
 */
router.post('/events/:id/publish', validateObjectId('id'), organizerController.publishEvent);

/**
 * @route   GET /api/organizer/events/:id/registrations
 * @desc    Get all registrations for an event
 * @access  Private (Organizers only)
 */
router.get('/events/:id/registrations', validateObjectId('id'), organizerController.getEventRegistrations);

/**
 * @route   POST /api/organizer/events/:eventId/attendance/:registrationId
 * @desc    Mark attendance for a participant
 * @access  Private (Organizers only)
 */
router.post(
  '/events/:eventId/attendance/:registrationId',
  organizerController.markAttendance
);

/**
 * @route   PUT /api/organizer/registrations/:registrationId/payment
 * @desc    Approve or reject payment
 * @access  Private (Organizers only)
 */
router.put(
  '/registrations/:registrationId/payment',
  organizerController.updatePaymentStatus
);

/**
 * @route   GET /api/organizer/events/:id/analytics
 * @desc    Get event analytics and statistics
 * @access  Private (Organizers only)
 */
router.get('/events/:id/analytics', validateObjectId('id'), organizerController.getEventAnalytics);

/**
 * @route   GET /api/organizer/events/:id/export
 * @desc    Export registrations data
 * @access  Private (Organizers only)
 */
router.get('/events/:id/export', validateObjectId('id'), organizerController.exportRegistrations);

module.exports = router;
