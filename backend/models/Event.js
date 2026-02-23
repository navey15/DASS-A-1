const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // Basic event information
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  eventDescription: {
    type: String,
    required: true,
    trim: true
  },
  eventType: {
    type: String,
    enum: ['Normal', 'Merchandise'],
    required: true,
    default: 'Normal'
  },
  
  // Organizer reference
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Event dates and deadlines
  eventStartDate: {
    type: Date,
    required: true
  },
  eventEndDate: {
    type: Date,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  
  // Registration limits
  registrationLimit: {
    type: Number,
    required: true,
    min: 1
  },
  currentRegistrations: {
    type: Number,
    default: 0
  },
  
  // Pricing
  registrationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Eligibility
  eligibility: {
    type: String,
    enum: ['IIIT Only', 'Non-IIIT Only', 'All'],
    default: 'All'
  },
  
  // Tags and categorization
  eventTags: [{
    type: String,
    trim: true
  }],
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  
  // Merchandise-specific fields
  merchandiseDetails: {
    items: [{
      name: String,
      description: String,
      size: [String],
      color: [String],
      variants: [String],
      price: Number,
      stockQuantity: Number,
      maxPerParticipant: {
        type: Number,
        default: 1
      }
    }]
  },
  
  // Custom registration form
  customRegistrationForm: {
    fields: [{
      fieldName: String,
      fieldType: {
        type: String,
        enum: ['text', 'number', 'email', 'tel', 'textarea', 'select', 'checkbox', 'radio', 'file', 'date']
      },
      label: String,
      placeholder: String,
      required: Boolean,
      options: [String], // For select, checkbox, radio
      validation: {
        minLength: Number,
        maxLength: Number,
        min: Number,
        max: Number,
        pattern: String
      }
    }]
  },
  
  // Team-based registration (for hackathons)
  isTeamEvent: {
    type: Boolean,
    default: false
  },
  teamSize: {
    min: Number,
    max: Number
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
eventSchema.index({ organizer: 1, status: 1 });
eventSchema.index({ eventStartDate: 1 });
eventSchema.index({ eventName: 'text', eventDescription: 'text', eventTags: 'text' });

// Method to check if registration is open
eventSchema.methods.isRegistrationOpen = function() {
  const now = new Date();
  return this.status === 'Published' && 
         now < this.registrationDeadline && 
         this.currentRegistrations < this.registrationLimit;
};

// Method to check if event has space
eventSchema.methods.hasAvailableSlots = function(requestedSlots = 1) {
  return (this.currentRegistrations + requestedSlots) <= this.registrationLimit;
};

// Method to increment registration count
eventSchema.methods.incrementRegistrations = async function(count = 1) {
  this.currentRegistrations += count;
  return await this.save();
};

// Method to decrement registration count
eventSchema.methods.decrementRegistrations = async function(count = 1) {
  this.currentRegistrations = Math.max(0, this.currentRegistrations - count);
  return await this.save();
};

// Validation: End date must be after start date
eventSchema.pre('save', function(next) {
  if (this.eventEndDate <= this.eventStartDate) {
    next(new Error('Event end date must be after start date'));
  } else if (this.registrationDeadline > this.eventStartDate) {
    next(new Error('Registration deadline must be before event start date'));
  } else {
    next();
  }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
