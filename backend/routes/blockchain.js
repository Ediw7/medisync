const express = require('express');
const router = express.Router();
const blockchainController = require('../controllers/blockchainController');
const { authenticateToken } = require('../middleware/auth');

router.get('/obat/:id', blockchainController.queryObatById);
router.post('/obat', authenticateToken, blockchainController.createObat);

module.exports = router;