import api from './api';

/**
 * Authentication Service
 */
const authService = {
  // Register participant
  registerParticipant: async (userData) => {
    return await api.post('/auth/register/participant', userData);
  },

  // Login
  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },

  // Get current user
  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },

  // Update profile
  updateProfile: async (userData) => {
    return await api.put('/auth/profile', userData);
  },

  // Change password
  changePassword: async (passwords) => {
    return await api.put('/auth/change-password', passwords);
  },
  
  // Request password reset (Organizer)
  requestPasswordReset: async (data) => {
    return await api.post('/auth/password-reset-request', data);
  },

  // Logout
  logout: async () => {
    return await api.post('/auth/logout');
  },

  // Set preferences
  setPreferences: async (preferences) => {
    return await api.post('/auth/preferences', preferences);
  },
};

/**
 * Events Service
 */
const eventService = {
  // Get all events
  getAllEvents: async (params = {}) => {
    return await api.get('/events', { params });
  },

  // Get single event
  getEventById: async (eventId) => {
    return await api.get(`/events/${eventId}`);
  },

  // Get trending events
  getTrendingEvents: async () => {
    return await api.get('/events/trending');
  },

  // Get followed clubs events
  getFollowedEvents: async () => {
    return await api.get('/events/followed');
  },

  // Get recommended events
  getRecommendedEvents: async () => {
    return await api.get('/events/recommended');
  },
};

/**
 * Registration Service
 */
const registrationService = {
  // Register for event
  registerForEvent: async (eventId, registrationData) => {
    // If registrationData is FormData, config for multipart is needed (axios usually handles this if data is FormData)
    if (registrationData instanceof FormData) {
        return await api.post(`/registrations/${eventId}`, registrationData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
    }
    return await api.post(`/registrations/${eventId}`, registrationData);
  },

  // Get my registrations
  getMyRegistrations: async (params = {}) => {
    return await api.get('/registrations/my-events', { params });
  },

  // Cancel registration
  cancelRegistration: async (registrationId) => {
    return await api.delete(`/registrations/${registrationId}`);
  },

  // Get registration by ticket
  getRegistrationByTicket: async (ticketId) => {
    return await api.get(`/registrations/ticket/${ticketId}`);
  },

  // Join team
  joinTeam: async (inviteCode) => {
    return await api.post('/registrations/join-team', { inviteCode });
  },
};

/**
 * Organizer Service
 */
const organizerService = {
  // Create event
  createEvent: async (eventData) => {
    return await api.post('/organizer/events', eventData);
  },

  // Get organizer events
  getOrganizerEvents: async (params = {}) => {
    return await api.get('/organizer/events', { params });
  },

  // Get event details
  getEventDetails: async (eventId) => {
    return await api.get(`/organizer/events/${eventId}`);
  },

  // Update event
  updateEvent: async (eventId, eventData) => {
    return await api.put(`/organizer/events/${eventId}`, eventData);
  },

  // Delete event
  deleteEvent: async (eventId) => {
    return await api.delete(`/organizer/events/${eventId}`);
  },

  // Publish event
  publishEvent: async (eventId) => {
    return await api.post(`/organizer/events/${eventId}/publish`);
  },

  // Get event registrations
  getEventRegistrations: async (eventId, params = {}) => {
    return await api.get(`/organizer/events/${eventId}/registrations`, { params });
  },

  // Mark attendance
  markAttendance: async (eventId, registrationId) => {
    return await api.post(`/organizer/events/${eventId}/attendance/${registrationId}`);
  },

  // Update payment status
  updatePaymentStatus: async (registrationId, status, comments) => {
    return await api.put(`/organizer/registrations/${registrationId}/payment`, { status, comments });
  },

  // Get event analytics
  getEventAnalytics: async (eventId) => {
    return await api.get(`/organizer/events/${eventId}/analytics`);
  },

  // Export registrations
  exportRegistrations: async (eventId) => {
    return await api.get(`/organizer/events/${eventId}/export`);
  },

  // Get Dashboard Stats
  getDashboardStats: async () => {
    return await api.get('/organizer/dashboard/stats');
  },
};

/**
 * Admin Service
 */
const adminService = {
  // Create organizer
  createOrganizer: async (organizerData) => {
    return await api.post('/admin/organizers', organizerData);
  },

  // Get all organizers
  getAllOrganizers: async (params = {}) => {
    return await api.get('/admin/organizers', { params });
  },

  // Update organizer
  updateOrganizer: async (organizerId, organizerData) => {
    return await api.put(`/admin/organizers/${organizerId}`, organizerData);
  },

  // Delete organizer
  deleteOrganizer: async (organizerId) => {
    return await api.delete(`/admin/organizers/${organizerId}`);
  },

  // Get password reset requests
  getPasswordResetRequests: async (params = {}) => {
    return await api.get('/admin/password-requests', { params });
  },

  // Approve password reset
  approvePasswordReset: async (requestId, adminComments) => {
    return await api.post(`/admin/password-requests/${requestId}/approve`, { adminComments });
  },

  // Reject password reset
  rejectPasswordReset: async (requestId, adminComments) => {
    return await api.post(`/admin/password-requests/${requestId}/reject`, { adminComments });
  },

  // Get statistics
  getStatistics: async () => {
    return await api.get('/admin/statistics');
  },

  // Get all participants
  getAllParticipants: async (params = {}) => {
    return await api.get('/admin/participants', { params });
  },

  // Get all events
  getAllEvents: async (params = {}) => {
    return await api.get('/admin/events', { params });
  },

  // Get password reset requests (Admin)
  getPasswordResetRequests: async (params = {}) => {
    return await api.get('/admin/password-requests', { params });
  },

  // Approve password reset request
  approvePasswordReset: async (id, data) => {
    return await api.post(`/admin/password-requests/${id}/approve`, data);
  },

  // Reject password reset request
  rejectPasswordReset: async (id, data) => {
    return await api.post(`/admin/password-requests/${id}/reject`, data);
  },
};

/**
 * Discussion Service
 */
const discussionService = {
  // Get event discussions
  getEventDiscussions: async (eventId, params = {}) => {
    return await api.get(`/discussions/${eventId}`, { params });
  },

  // Post discussion
  postDiscussion: async (eventId, message, messageType) => {
    return await api.post(`/discussions/${eventId}`, { message, messageType });
  },

  // Reply to discussion
  replyToDiscussion: async (discussionId, message) => {
    return await api.post(`/discussions/${discussionId}/reply`, { message });
  },

  // Toggle pin
  togglePinDiscussion: async (discussionId) => {
    return await api.put(`/discussions/${discussionId}/pin`);
  },

  // Delete discussion
  deleteDiscussion: async (discussionId) => {
    return await api.delete(`/discussions/${discussionId}`);
  },
};

/**
 * Feedback Service
 */
const feedbackService = {
  // Submit feedback
  submitFeedback: async (eventId, feedbackData) => {
    return await api.post(`/feedback/${eventId}`, feedbackData);
  },

  // Get event feedback
  getEventFeedback: async (eventId, params = {}) => {
    return await api.get(`/feedback/${eventId}`, { params });
  },
};

/**
 * User Service
 */
const userService = {
  // Submit password reset request
  submitPasswordResetRequest: async (reason) => {
    return await api.post('/users/password-reset/request', { reason });
  },

  // Get my password reset requests
  getMyPasswordResetRequests: async () => {
    return await api.get('/users/password-reset/my-requests');
  },

  // Toggle follow organizer
  toggleFollowOrganizer: async (organizerId) => {
    return await api.post(`/users/follow/${organizerId}`);
  },

  // Get organizers list
  getOrganizers: async (params = {}) => {
    return await api.get('/users/organizers', { params });
  },

  // Get organizer profile
  getOrganizerProfile: async (organizerId) => {
    return await api.get(`/users/organizers/${organizerId}`);
  },

  // Get participant dashboard stats
  getDashboardStats: async () => {
    return await api.get('/users/dashboard');
  },
};

export {
  authService,
  eventService,
  registrationService,
  organizerService,
  adminService,
  discussionService,
  feedbackService,
  userService,
};
