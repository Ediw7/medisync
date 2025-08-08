const db = require('../../config/db');

const pesananController = {
    // Mengambil semua pesanan yang dibuat oleh PBF yang sedang login
    getAll: async (req, res) => {
        try {
            // Query ini menggabungkan beberapa tabel untuk mendapatkan informasi lengkap
            const sql = `
                SELECT 
                    p.id, 
                    p.status_pesanan, 
                    p.tanggal_pesan, 
                    p.total_harga,
                    p.metode_pembayaran,
                    p.alamat_pengiriman,
                    produsen.nama_resmi as nama_produsen
                FROM pesanan p
                JOIN users produsen ON p.id_produsen = produsen.id
                WHERE p.id_pbf = ?
                ORDER BY p.tanggal_pesan DESC
            `;
            const [rows] = await db.query(sql, [req.user.id]);
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error("Error in getAll pesanan:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Di sini nanti Anda akan membuat fungsi untuk 'create', 'getById', dll.
};

module.exports = pesananController;
