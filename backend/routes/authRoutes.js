const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { 
  validateRegistration, 
  validateLogin 
} = require('../middleware/validation');

/**
 * @route   POST /api/auth/register/participant
 * @desc    Register a new participant
 * @access  Public
 */
router.post('/register/participant', validateRegistration, authController.registerParticipant);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   POST /api/auth/password-reset-request
 * @desc    Request password reset (Organizer)
 * @access  Public
 */
router.post('/password-reset-request', authController.requestPasswordReset);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, authController.updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, authController.changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/auth/preferences
 * @desc    Set user preferences (for participants after registration)
 * @access  Private
 */
router.post('/preferences', authenticate, authController.setPreferences);

module.exports = router;
