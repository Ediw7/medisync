const express = require('express');
const router = express.Router();
const produksiController = require('../../controllers/produsen/produksiController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

router.use(authenticateToken, authorizeRole('produsen'));

router.get('/jadwal', produksiController.getAll);
router.get('/:id', produksiController.getById);
router.post('/', upload.single('dokumen_bpom'), produksiController.create);
router.put('/:id', upload.single('dokumen_bpom'), produksiController.update);
router.delete('/:id', produksiController.delete);

// --- RUTE BARU ---
router.post('/:id/record', produksiController.recordToBlockchain);

module.exports = router;
