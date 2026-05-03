// controllers/complaints.js

const Complaint = require('../models/Complaint');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────
// @desc    Get all complaints (admin sees all, citizen sees own)
// @route   GET /api/complaints
// @access  Private
// ─────────────────────────────────────────────────────────────
exports.getComplaints = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user.id };

    const complaints = await Complaint.find(filter)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
exports.getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .populate('internalNotes.addedBy', 'name email');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Citizens can only view their own complaints
    if (req.user && req.user.role !== 'admin' &&
      complaint.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorised to view this complaint' });
    }

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get public complaints (no auth required)
// @route   GET /api/complaints/public
// @access  Public
// ─────────────────────────────────────────────────────────────
exports.getPublicComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({})
      .select('title category priority status geoCoordinates location createdAt')
      .sort('-createdAt')
      .limit(100);

    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get complaints filed by the logged-in citizen
// @route   GET /api/complaints/my
// @access  Private
// ─────────────────────────────────────────────────────────────
exports.getComplaintsByUser = async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user.id })
      .populate('assignedTo', 'name email')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Create complaint
// @route   POST /api/complaints
// @access  Private (citizen)
// ─────────────────────────────────────────────────────────────
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, location, lat, lng } = req.body;

    // Validate map coordinates
    if (lat === undefined || lat === null || lat === '') {
      return res.status(400).json({ success: false, message: 'Please pin a location on the map (latitude missing).' });
    }
    if (lng === undefined || lng === null || lng === '') {
      return res.status(400).json({ success: false, message: 'Please pin a location on the map (longitude missing).' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates. Please re-pin the location.' });
    }

    const attachments = req.files ? req.files.map(f => f.path) : [];

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority: priority || 'Medium',
      location: location || '',
      geoCoordinates: { lat: parsedLat, lng: parsedLng },
      user: req.user.id,
      attachments,
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(v => v.message);
      return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Update complaint (owner or admin)
// @route   PUT /api/complaints/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
exports.updateComplaint = async (req, res) => {
  try {
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin' && complaint.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorised to update this complaint' });
    }

    // Citizens cannot change status directly
    if (req.user.role !== 'admin') {
      delete req.body.status;
      delete req.body.assignedTo;
    }

    req.body.updatedAt = Date.now();

    complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin' && complaint.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorised to delete this complaint' });
    }

    await complaint.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Update complaint status
// @route   PATCH /api/complaints/:id/status
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Closed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Append to status history
    complaint.statusHistory.push({
      previousStatus: complaint.status,
      newStatus: status,
      changedBy: req.user.id,
    });

    complaint.status = status;
    complaint.updatedAt = Date.now();

    if (status === 'Resolved') complaint.resolvedAt = Date.now();

    await complaint.save();

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Assign complaint to an admin
// @route   PUT /api/complaints/:id/assign
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────
exports.assignComplaint = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ success: false, message: 'adminId is required' });
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Target user is not an admin' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { assignedTo: adminId, updatedAt: Date.now() },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Add internal note to complaint
// @route   POST /api/complaints/:id/notes
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────
exports.addInternalNote = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Note text is required' });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.internalNotes.push({ text: text.trim(), addedBy: req.user.id });
    complaint.updatedAt = Date.now();
    await complaint.save();

    const updated = await Complaint.findById(req.params.id)
      .populate('internalNotes.addedBy', 'name email');

    res.status(200).json({ success: true, data: updated.internalNotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get analytics summary
// @route   GET /api/complaints/analytics
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const [
      total,
      byStatus,
      byCategory,
      byPriority,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    ]);

    res.status(200).json({
      success: true,
      data: { total, byStatus, byCategory, byPriority },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get list of all admins (for assignment dropdown)
// @route   GET /api/complaints/admins
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────
exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('name email');
    res.status(200).json({ success: true, count: admins.length, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};