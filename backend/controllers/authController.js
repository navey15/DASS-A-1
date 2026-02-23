const User = require('../models/User');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const { 
  generateToken, 
  generateRandomPassword, 
  sendSuccess, 
  sendError,
  verifyCaptcha 
} = require('../utils/helpers');

/**
 * Register a new participant
 * POST /api/auth/register/participant
 */
const registerParticipant = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      participantType, 
      college, 
      contactNumber 
    } = req.body;
    
    const captchaToken = req.body.captchaToken;
    if (!captchaToken) {
        return sendError(res, 400, "Please verify you're not a robot.");
    }
    
    if (captchaToken) {
       const isCaptchaValid = await verifyCaptcha(captchaToken);
       if (!isCaptchaValid) {
         return sendError(res, 400, 'CAPTCHA verification failed. Please try again.');
       }
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return sendError(res, 400, 'Email already registered. Please use a different email or login.');
    }
    
    // Validate IIIT email domain for IIIT participants
    if (participantType === 'IIIT') {
      if (!email.toLowerCase().endsWith('iiit.ac.in')) {
        return sendError(res, 400, 'IIIT participants must register with @iiit.ac.in email address.');
      }
    }
    
    // Create new participant
    const user = await User.create({
      email,
      password,
      role: 'participant',
      firstName,
      lastName,
      participantType,
      college,
      contactNumber
    });
    
    // Generate token
    const token = generateToken(user._id, user.role);
    
    // Return success response
    sendSuccess(res, 201, 'Registration successful! Welcome to Felicity!', {
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Participant registration error:', error);
    sendError(res, 500, 'Registration failed. Please try again.', error.message);
  }
};

/**
 * Request password reset (Organizer only)
 * POST /api/auth/request-password-reset
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email, reason } = req.body;
    
    // Find organizer
    const user = await User.findOne({ email, role: 'organizer' });
    
    if (!user) {
      // Return 404 only if it's completely safe, otherwise 200 generic message
      // But for organizers, finding them matters.
      return sendError(res, 404, 'Organizer account with this email not found.');
    }
    
    // Check for existing pending request
    const existingRequest = await PasswordResetRequest.findOne({
      organizer: user._id,
      status: 'Pending'
    });
    
    if (existingRequest) {
      return sendError(res, 400, 'You already have a pending password reset request.');
    }
    
    // Create request
    await PasswordResetRequest.create({
      organizer: user._id,
      reason
    });
    
    sendSuccess(res, 201, 'Password reset request submitted to admin successfully.');
  } catch (error) {
    console.error('Password reset request error:', error);
    sendError(res, 500, 'Failed to submit password reset request.');
  }
};

/**
 * Login user (participant/organizer/admin)
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, captchaToken } = req.body; // Expect captchaToken
    if (!captchaToken) {
        return sendError(res, 400, "Please verify you're not a robot.");
    }
    
    // Verify CAPTCHA
    if (captchaToken) {
       const isCaptchaValid = await verifyCaptcha(captchaToken);
       if (!isCaptchaValid) {
         return sendError(res, 400, 'CAPTCHA verification failed. Please try again.');
       }
    }
    
    // Trim password to avoid copy-paste errors with leading/trailing spaces
    const password = req.body.password ? req.body.password.trim() : '';
    
    // Find user by email
    const user = await User.findByEmail(email);
    
    if (!user) {
      return sendError(res, 401, 'Invalid email or password.');
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return sendError(res, 401, 'Invalid email or password.');
    }
    
    // Check if organizer is approved
    if (user.role === 'organizer' && !user.isApproved) {
      return sendError(res, 403, 'Your organizer account is pending admin approval. Please contact the administrator.');
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken(user._id, user.role);
    
    // Return success response
    sendSuccess(res, 200, 'Login successful!', {
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 500, 'Login failed. Please try again.');
  }
};

/**
 * Get current logged-in user
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }
    
    sendSuccess(res, 200, 'User data retrieved successfully.', {
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get current user error:', error);
    sendError(res, 500, 'Failed to retrieve user data.');
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;
    
    // Fields that cannot be updated
    const restrictedFields = ['email', 'password', 'role', 'isApproved', 'createdAt'];
    restrictedFields.forEach(field => delete updates[field]);
    
    // For organizers, some fields require admin approval
    if (req.user.role === 'organizer') {
      const adminOnlyFields = ['organizerName', 'category'];
      const hasAdminOnlyUpdates = adminOnlyFields.some(field => updates[field]);
      
      if (hasAdminOnlyUpdates) {
        return sendError(res, 403, 'Changes to organizer name or category require admin approval. Please contact administrator.');
      }
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }
    
    sendSuccess(res, 200, 'Profile updated successfully!', {
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    sendError(res, 500, 'Failed to update profile.');
  }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Current password and new password are required.');
    }
    
    // Get user with password
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return sendError(res, 401, 'Current password is incorrect.');
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    sendSuccess(res, 200, 'Password changed successfully!');
  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, 500, 'Failed to change password.');
  }
};

/**
 * Logout user (client-side token removal, can add token blacklist if needed)
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // In a more advanced implementation, you would add the token to a blacklist
    // For now, client-side token removal is sufficient
    
    sendSuccess(res, 200, 'Logout successful!');
  } catch (error) {
    console.error('Logout error:', error);
    sendError(res, 500, 'Logout failed.');
  }
};

/**
 * Set user preferences after registration
 * POST /api/auth/preferences
 */
const setPreferences = async (req, res) => {
  try {
    const { areasOfInterest, clubsToFollow } = req.body;
    
    if (!req.user || req.user.role !== 'participant') {
      return sendError(res, 403, 'Only participants can set preferences.');
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          areasOfInterest: areasOfInterest || [],
          clubsToFollow: clubsToFollow || []
        }
      },
      { new: true }
    ).select('-password');
    
    sendSuccess(res, 200, 'Preferences saved successfully!', {
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Set preferences error:', error);
    sendError(res, 500, 'Failed to save preferences.');
  }
};

module.exports = {
  registerParticipant,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
  setPreferences,
  requestPasswordReset
};
