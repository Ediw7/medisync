const express = require('express');
const router = express.Router();
const pesananController = require('../../controllers/pbf/pesananController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

router.use(authenticateToken, authorizeRole('pbf'));

router.get('/', pesananController.getAll);
router.get('/:id', pesananController.getById); // Rute baru untuk detail pesanan
router.post('/', pesananController.create);

module.exports = router;