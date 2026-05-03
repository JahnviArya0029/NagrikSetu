const express = require('express');
const {
  getComments,
  getComment,
  createComment,
  updateComment,
  deleteComment,
} = require('../controllers/comments');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

router
  .route('/')
  .get(getComments)
  .post(createComment);

router
  .route('/:commentId')
  .get(getComment)
  .put(updateComment)
  .delete(deleteComment);

module.exports = router;