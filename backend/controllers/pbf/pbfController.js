const db = require('../../config/db');

const pbfController = {
    // Mengambil daftar semua produsen yang terdaftar
    getProdusenList: async (req, res) => {
        try {
            const [rows] = await db.query("SELECT id, nama_resmi, alamat, email FROM users WHERE role = 'produsen'");
            res.json({ success: true, data: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // PERBAIKAN: Mengambil stok yang tersedia dari tabel 'produksi'
    getAvailableStockByProdusen: async (req, res) => {
        try {
            const { idProdusen } = req.params;
            // Query ini hanya mengambil batch yang statusnya 'Selesai' atau 'Tercatat di Blockchain'
            const sql = `
                SELECT id, batch_id, nama_obat, jumlah, dosis, tanggal_kadaluarsa 
                FROM produksi 
                WHERE id_produsen = ? AND status IN ('Selesai', 'Tercatat di Blockchain') AND jumlah > 0
            `;
            const [rows] = await db.query(sql, [idProdusen]);
            res.json({ success: true, data: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = pbfController;