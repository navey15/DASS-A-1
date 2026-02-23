const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  // References
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Registration status
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Waitlisted'],
    default: 'Pending'
  },
  
  // Team registration fields
  isTeamRegistration: {
    type: Boolean,
    default: false
  },
  team: {
    teamName: String,
    teamLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    targetTeamSize: {
      type: Number,
      required: false
    },
    teamMembers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      email: String,
      status: {
        type: String,
        enum: ['Invited', 'Accepted', 'Declined'],
        default: 'Invited'
      }
    }],
    inviteCode: String
  },
  
  // Custom form responses
  formResponses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Ticket information
  ticketId: {
    type: String,
    unique: true,
    sparse: true
  },
  qrCode: String,
  
  // Payment information (for merchandise or paid events)
  payment: {
    required: {
      type: Boolean,
      default: false
    },
    amount: Number,
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
      default: 'Pending'
    },
    proofImage: String,
    transactionId: String,
    paidAt: Date
  },
  
  // Merchandise-specific fields
  merchandisePurchase: {
    items: [{
      itemId: String,
      name: String,
      variant: String, // e.g., "Large-Blue"
      quantity: Number,
      price: Number
    }],
    totalAmount: Number
  },
  
  // Attendance tracking
  attendance: {
    marked: {
      type: Boolean,
      default: false
    },
    markedAt: Date,
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Timestamps
  registeredAt: {
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

// Compound index to prevent duplicate registrations
registrationSchema.index({ event: 1, participant: 1 }, { unique: true });

// Index for queries
registrationSchema.index({ status: 1, registeredAt: -1 });
registrationSchema.index({ ticketId: 1 });

// Generate unique ticket ID
registrationSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketId) {
    // Generate a unique ticket ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.ticketId = `TKT-${timestamp}-${random}`;
  }
  next();
});

// Method to generate QR code data
registrationSchema.methods.getQRCodeData = function() {
  return JSON.stringify({
    ticketId: this.ticketId,
    eventId: this.event,
    participantId: this.participant,
    registeredAt: this.registeredAt
  });
};

// Method to mark attendance
registrationSchema.methods.markAttendance = async function(markedBy) {
  this.attendance.marked = true;
  this.attendance.markedAt = new Date();
  this.attendance.markedBy = markedBy;
  return await this.save();
};

// Static method to get event statistics
registrationSchema.statics.getEventStats = async function(eventId) {
  const stats = await this.aggregate([
    { $match: { event: new mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    waitlisted: 0
  };
  
  stats.forEach(stat => {
    result.total += stat.count;
    result[stat._id.toLowerCase()] = stat.count;
  });
  
  return result;
};

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
