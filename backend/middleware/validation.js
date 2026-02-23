const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = {};
    errors.array().forEach(err => {
      extractedErrors[err.path || err.param] = err.msg;
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors
    });
  }
  
  next();
};

/**
 * Validation rules for user registration
 */
const validateRegistration = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .isIn(['participant', 'organizer'])
    .withMessage('Role must be either participant or organizer'),
  
  // Participant-specific validations
  body('firstName')
    .if(body('role').equals('participant'))
    .trim()
    .notEmpty()
    .withMessage('First name is required for participants')
    .isLength({ max: 50 })
    .withMessage('First name must not exceed 50 characters'),
  
  body('lastName')
    .if(body('role').equals('participant'))
    .trim()
    .notEmpty()
    .withMessage('Last name is required for participants')
    .isLength({ max: 50 })
    .withMessage('Last name must not exceed 50 characters'),
  
  body('participantType')
    .if(body('role').equals('participant'))
    .isIn(['IIIT', 'Non-IIIT'])
    .withMessage('Participant type must be either IIIT or Non-IIIT'),
  
  validate
];

/**
 * Validation rules for login
 */
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  validate
];

/**
 * Validation rules for event creation
 */
const validateEventCreation = [
  body('eventName')
    .trim()
    .notEmpty()
    .withMessage('Event name is required')
    .isLength({ max: 200 })
    .withMessage('Event name must not exceed 200 characters'),
  
  body('eventDescription')
    .trim()
    .notEmpty()
    .withMessage('Event description is required')
    .isLength({ max: 5000 })
    .withMessage('Event description must not exceed 5000 characters'),
  
  body('eventType')
    .isIn(['Normal', 'Merchandise'])
    .withMessage('Event type must be either Normal or Merchandise'),
  
  body('eventStartDate')
    .isISO8601()
    .withMessage('Invalid event start date'),
  
  body('eventEndDate')
    .isISO8601()
    .withMessage('Invalid event end date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.eventStartDate)) {
        throw new Error('Event end date must be after start date');
      }
      return true;
    }),
  
  body('registrationDeadline')
    .isISO8601()
    .withMessage('Invalid registration deadline')
    .custom((value, { req }) => {
      if (new Date(value) > new Date(req.body.eventStartDate)) {
        throw new Error('Registration deadline must be before event start date');
      }
      return true;
    }),
  
  body('registrationLimit')
    .isInt({ min: 1 })
    .withMessage('Registration limit must be at least 1'),
  
  body('registrationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Registration fee must be a positive number'),
  
  body('eligibility')
    .optional()
    .isIn(['IIIT Only', 'Non-IIIT Only', 'All'])
    .withMessage('Invalid eligibility value'),
  
  validate
];

/**
 * Validation rules for event registration
 */
const validateEventRegistration = [
  param('eventId')
    .isMongoId()
    .withMessage('Invalid event ID'),
  
  body('formResponses')
    .optional()
    .isObject()
    .withMessage('Form responses must be an object'),
  
  validate
];

/**
 * Validation rules for password reset request
 */
const validatePasswordResetRequest = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  
  validate
];

/**
 * Validation for MongoDB ObjectId parameters
 */
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  
  validate
];

module.exports = {
  validate,
  validateRegistration,
  validateLogin,
  validateEventCreation,
  validateEventRegistration,
  validatePasswordResetRequest,
  validateObjectId
};
