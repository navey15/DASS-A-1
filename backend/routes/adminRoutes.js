const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @route   POST /api/admin/organizers
 * @desc    Create new organizer account
 * @access  Private (Admin only)
 */
router.post('/organizers', adminController.createOrganizer);

/**
 * @route   GET /api/admin/organizers
 * @desc    Get all organizers
 * @access  Private (Admin only)
 */
router.get('/organizers', adminController.getAllOrganizers);

/**
 * @route   PUT /api/admin/organizers/:id
 * @desc    Update organizer details
 * @access  Private (Admin only)
 */
router.put('/organizers/:id', validateObjectId('id'), adminController.updateOrganizer);

/**
 * @route   DELETE /api/admin/organizers/:id
 * @desc    Delete organizer
 * @access  Private (Admin only)
 */
router.delete('/organizers/:id', validateObjectId('id'), adminController.deleteOrganizer);

/**
 * @route   GET /api/admin/password-requests
 * @desc    Get all password reset requests
 * @access  Private (Admin only)
 */
router.get('/password-requests', adminController.getPasswordResetRequests);

/**
 * @route   POST /api/admin/password-requests/:id/approve
 * @desc    Approve password reset request
 * @access  Private (Admin only)
 */
router.post(
  '/password-requests/:id/approve',
  validateObjectId('id'),
  adminController.approvePasswordReset
);

/**
 * @route   POST /api/admin/password-requests/:id/reject
 * @desc    Reject password reset request
 * @access  Private (Admin only)
 */
router.post(
  '/password-requests/:id/reject',
  validateObjectId('id'),
  adminController.rejectPasswordReset
);

/**
 * @route   GET /api/admin/statistics
 * @desc    Get system-wide statistics
 * @access  Private (Admin only)
 */
router.get('/statistics', adminController.getSystemStatistics);

/**
 * @route   GET /api/admin/participants
 * @desc    Get all participants
 * @access  Private (Admin only)
 */
router.get('/participants', adminController.getAllParticipants);

/**
 * @route   GET /api/admin/events
 * @desc    Get all events (admin view)
 * @access  Private (Admin only)
 */
router.get('/events', adminController.getAllEventsAdmin);

module.exports = router;
