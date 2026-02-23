const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  // Common fields for all users
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return this.role !== 'organizer'; // Organizers get credentials from admin
    },
    minlength: 8
  },
  role: {
    type: String,
    enum: ['participant', 'organizer', 'admin'],
    required: true
  },
  
  // Participant-specific fields
  firstName: {
    type: String,
    required: function() {
      return this.role === 'participant';
    },
    trim: true
  },
  lastName: {
    type: String,
    required: function() {
      return this.role === 'participant';
    },
    trim: true
  },
  participantType: {
    type: String,
    enum: ['IIIT', 'Non-IIIT'],
    required: function() {
      return this.role === 'participant';
    }
  },
  college: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  
  // Participant preferences
  areasOfInterest: [{
    type: String
  }],
  clubsToFollow: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  }],
  
  // Organizer-specific fields
  organizerName: {
    type: String,
    required: function() {
      return this.role === 'organizer';
    },
    trim: true
  },
  category: {
    type: String,
    enum: ['Club', 'Council', 'Fest Team'],
    required: function() {
      return this.role === 'organizer';
    }
  },
  description: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  
  // Session and security
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
