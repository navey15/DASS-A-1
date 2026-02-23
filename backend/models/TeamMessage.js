const mongoose = require('mongoose');

const teamMessageSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration', // This is the leader's registration ID that holds the team
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    // required: true // Can be empty if file
  },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'link'],
    default: 'text'
  },
  fileUrl: String,
  fileName: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const TeamMessage = mongoose.model('TeamMessage', teamMessageSchema);

module.exports = TeamMessage;
