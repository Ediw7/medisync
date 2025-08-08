const express = require('express');
const router = express.Router();
const pesananController = require('../../controllers/pbf/pesananController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Semua rute di sini dilindungi dan hanya untuk PBF
router.use(authenticateToken, authorizeRole('pbf'));

router.get('/', pesananController.getAll);
// Nanti tambahkan rute lain seperti POST untuk membuat pesanan baru
// router.post('/', pesananController.create);

module.exports = router;
