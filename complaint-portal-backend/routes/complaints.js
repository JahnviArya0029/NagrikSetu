// ── routes/complaints.js ──
// Fixed version with multer upload middleware on POST route

const express = require('express');
const {
  getComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  getComplaintsByUser,
  getPublicComplaints,
  updateComplaintStatus,
  assignComplaint,
  getAnalytics,
  addInternalNote,
  getAdmins,
} = require('../controllers/complaints');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload'); // ← multer

const router = express.Router();

// ── Public routes (no login needed) ──
router.get('/public',     getPublicComplaints);
router.get('/public/:id', getComplaint);

// ── All routes below require login ──
router.use(protect);

// Analytics + admin list
router.get('/analytics', authorize('admin'), getAnalytics);
router.get('/admins',    authorize('admin'), getAdmins);

// Citizen: get own complaints
router.get('/my', getComplaintsByUser);

// Main complaint routes
router
  .route('/')
  .get(authorize('admin'), getComplaints)   // admin only: see ALL complaints
  .post(
    authorize('citizen'),
    upload.array('attachments', 5),
    createComplaint
  );

// Admin only routes
router.patch('/:id/status', authorize('admin'), updateComplaintStatus);
router.put('/:id/assign',   authorize('admin'), assignComplaint);
router.post('/:id/notes',   authorize('admin'), addInternalNote);

// Single complaint routes — protect already applied via router.use(protect)
router
  .route('/:id')
  .get(getComplaint)
  .put(updateComplaint)
  .delete(deleteComplaint);

module.exports = router;