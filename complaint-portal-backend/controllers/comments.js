const Comment = require('../models/Comment');
const Complaint = require('../models/Complaint');

// @desc    Get all comments for a complaint
// @route   GET /api/comments/:complaintId
// @access  Private
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ complaint: req.params.complaintId })
      .populate('user', 'name email role')
      .sort('-createdAt');

    // Filter out internal comments for non-admin users
    const filteredComments = req.user.role === 'admin'
      ? comments
      : comments.filter(comment => !comment.isInternal);

    res.status(200).json({
      success: true,
      count: filteredComments.length,
      data: filteredComments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single comment
// @route   GET /api/comments/:complaintId/:commentId
// @access  Private
exports.getComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
      .populate('user', 'name email role');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if user can access this comment
    if (comment.isInternal && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this comment',
      });
    }

    // Check if comment belongs to the complaint
    if (comment.complaint.toString() !== req.params.complaintId) {
      return res.status(400).json({
        success: false,
        message: 'Comment does not belong to this complaint',
      });
    }

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new comment
// @route   POST /api/comments/:complaintId
// @access  Private
exports.createComment = async (req, res) => {
  try {
    // Check if complaint exists
    const complaint = await Complaint.findById(req.params.complaintId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    // Check if user can comment on this complaint
    if (req.user.role !== 'admin' && complaint.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this complaint',
      });
    }

    // Only admins can create internal comments
    if (req.body.isInternal && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create internal comments',
      });
    }

    const comment = await Comment.create({
      ...req.body,
      complaint: req.params.complaintId,
      user: req.user.id,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name email role');

    res.status(201).json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:complaintId/:commentId
// @access  Private
exports.updateComment = async (req, res) => {
  try {
    let comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if comment belongs to the complaint
    if (comment.complaint.toString() !== req.params.complaintId) {
      return res.status(400).json({
        success: false,
        message: 'Comment does not belong to this complaint',
      });
    }

    // Make sure user is comment owner or admin
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment',
      });
    }

    // Only admins can update isInternal field
    if (req.body.isInternal !== undefined && req.user.role !== 'admin') {
      delete req.body.isInternal;
    }

    comment = await Comment.findByIdAndUpdate(req.params.commentId, req.body, {
      new: true,
      runValidators: true,
    }).populate('user', 'name email role');

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:complaintId/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if comment belongs to the complaint
    if (comment.complaint.toString() !== req.params.complaintId) {
      return res.status(400).json({
        success: false,
        message: 'Comment does not belong to this complaint',
      });
    }

    // Make sure user is comment owner or admin
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
      });
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};