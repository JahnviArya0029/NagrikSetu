const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please add comment content'],
    trim: true,
    maxlength: [500, 'Comment cannot be more than 500 characters'],
  },
  complaint: {
    type: mongoose.Schema.ObjectId,
    ref: 'Complaint',
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  isInternal: {
    type: Boolean,
    default: false, // If true, only admins can see this comment
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for better query performance
commentSchema.index({ complaint: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);