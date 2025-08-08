const express = require('express');
const router = express.Router();
const pbfController = require('../../controllers/pbf/pbfController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

router.use(authenticateToken, authorizeRole('pbf'));

router.get('/produsen', pbfController.getProdusenList);
// PERBAIKAN: Rute ini sekarang mengambil stok
router.get('/produsen/:idProdusen/stok', pbfController.getAvailableStockByProdusen);

module.exports = router;