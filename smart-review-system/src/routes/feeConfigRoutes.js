const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { upsertFeeConfig, getFeeConfig, getAllFeeConfigs, deleteFeeConfig } = require('../controllers/feeConfigController');
const { protect } = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

const adminFeeConfigLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 80,
    message: { success: false, message: 'Too many fee configuration actions. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Public lookup for seller calculator and product listing previews.
router.get('/', getFeeConfig);

// Admin-only fee configuration management.
router.post('/', protect, authorize('admin'), adminFeeConfigLimiter, upsertFeeConfig);
router.get('/all', protect, authorize('admin'), getAllFeeConfigs);
router.delete('/:country/:platform', protect, authorize('admin'), adminFeeConfigLimiter, deleteFeeConfig);

module.exports = router;