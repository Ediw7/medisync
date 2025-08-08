const express = require('express');
const router = express.Router();
const pesananController = require('../../controllers/pbf/pesananController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

router.use(authenticateToken, authorizeRole('pbf'));

router.get('/', pesananController.getAll);
router.post('/', pesananController.create); // <-- RUTE BARU

module.exports = router;
