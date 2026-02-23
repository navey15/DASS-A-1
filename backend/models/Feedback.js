const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevent duplicate feedback from same participant for same event
feedbackSchema.index({ event: 1, participant: 1 }, { unique: true });

// Static method to calculate average rating for an event
feedbackSchema.statics.getEventAverageRating = async function(eventId) {
  const result = await this.aggregate([
    { $match: { event: new mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalFeedbacks: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);
  
  if (result.length === 0) {
    return { averageRating: 0, totalFeedbacks: 0, distribution: {} };
  }
  
  const data = result[0];
  
  // Calculate rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  data.ratingDistribution.forEach(rating => {
    distribution[rating]++;
  });
  
  return {
    averageRating: Math.round(data.averageRating * 10) / 10,
    totalFeedbacks: data.totalFeedbacks,
    distribution
  };
};

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
