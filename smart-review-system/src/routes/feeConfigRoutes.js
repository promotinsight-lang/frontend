const express = require('express');
const router = express.Router();

const { upsertFeeConfig, getFeeConfig, getAllFeeConfigs, deleteFeeConfig } = require('../controllers/feeConfigController');

router.post('/', upsertFeeConfig);
router.get('/', getFeeConfig);
router.get('/all', getAllFeeConfigs); 
router.delete('/:country/:platform', deleteFeeConfig); // 🔥 NEW: Delete Route

module.exports = router;