// models/Complaint.js

const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a complaint title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please add a complaint description'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Please add a complaint category'],
    enum: [
      'Infrastructure',
      'Sanitation',
      'Water Supply',
      'Electricity',
      'Roads',
      'Public Transport',
      'Healthcare',
      'Education',
      'Law Enforcement',
      'Environment',
      'Other',
    ],
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Closed'],
    default: 'Pending',
  },

  // Free-text address / landmark (optional, user-typed)
  location: {
    type: String,
    trim: true,
  },

  // ── Map coordinates (required) ──────────────────────────────
  geoCoordinates: {
    lat: {
      type: Number,
      required: [true, 'Complaint location latitude is required'],
      min: [-90,  'Latitude must be >= -90'],
      max: [90,   'Latitude must be <= 90'],
    },
    lng: {
      type: Number,
      required: [true, 'Complaint location longitude is required'],
      min: [-180, 'Longitude must be >= -180'],
      max: [180,  'Longitude must be <= 180'],
    },
  },
  // ─────────────────────────────────────────────────────────────

  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  attachments: [{
    type: String, // relative paths / URLs returned by multer
  }],
  resolution: {
    type: String,
    trim: true,
  },
  resolvedAt: {
    type: Date,
  },
  internalNotes: [
    {
      text: {
        type: String,
        required: true,
        trim: true,
        maxlength: [2000, 'Note cannot exceed 2000 characters'],
      },
      addedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  statusHistory: [
    {
      previousStatus: {
        type: String,
        enum: ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Closed'],
      },
      newStatus: {
        type: String,
        enum: ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Closed'],
        required: true,
      },
      changedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

complaintSchema.index({ user: 1, createdAt: -1 });
complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ category: 1 });
// Optional: 2dsphere index for geo queries later
complaintSchema.index({ 'geoCoordinates.lat': 1, 'geoCoordinates.lng': 1 });

module.exports = mongoose.model('Complaint', complaintSchema);