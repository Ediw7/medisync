const express = require('express');
const router = express.Router();
const pbfController = require('../../controllers/pbf/pbfController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

router.use(authenticateToken, authorizeRole('pbf'));

router.get('/produsen', pbfController.getProdusenList);
router.get('/produsen/:idProdusen/stok', pbfController.getAvailableStockByProdusen);
router.get('/profile', pbfController.getProfile); // Rute baru untuk profil PBF

module.exports = router;