const db = require('../../config/db');
const fs = require('fs');
const path = require('path');

const pesananController = {
    getAll: async (req, res) => {
        try {
            const sql = `
                SELECT 
                    p.id, p.status_pesanan, p.tanggal_pesan, p.total_harga,
                    produsen.nama_resmi as nama_produsen, p.alamat_pengiriman
                FROM pesanan p
                JOIN users produsen ON p.id_produsen = produsen.id
                WHERE p.id_pbf = ? ORDER BY p.tanggal_pesan DESC
            `;
            const [rows] = await db.query(sql, [req.user.id]);
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error("Error in getAll pesanan:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    create: async (req, res) => {
        const connection = await db.getConnection();
        try {
            const { infoPemesanan, detailObat, tandaTanganDataUrl } = req.body;
            const idPbf = req.user.id;

            if (!infoPemesanan || !detailObat || detailObat.length === 0 || !tandaTanganDataUrl) {
                return res.status(400).json({ success: false, message: 'Data pesanan, item obat, dan tanda tangan wajib diisi.' });
            }

            await connection.beginTransaction();

            // 1. Simpan gambar tanda tangan dari base64 ke file
            const base64Data = tandaTanganDataUrl.replace(/^data:image\/png;base64,/, "");
            const fileName = `ttd-pesanan-${Date.now()}.png`;
            const filePath = path.join('uploads', fileName);
            fs.writeFileSync(filePath, base64Data, 'base64');

            // 2. Masukkan data ke tabel 'pesanan'
            const pesananSql = `
                INSERT INTO pesanan 
                (id_pbf, id_produsen, nama_apoteker_pbf, jabatan_apoteker_pbf, nomor_sipa_pbf, alamat_produsen, telepon_produsen, alamat_pengiriman, total_harga, metode_pembayaran, tanda_tangan_path) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [pesananResult] = await connection.execute(pesananSql, [
                idPbf, infoPemesanan.idProdusen, infoPemesanan.namaApoteker, infoPemesanan.jabatan, infoPemesanan.nomorSipa,
                infoPemesanan.alamatProdusen, infoPemesanan.teleponProdusen, infoPemesanan.alamatPengiriman,
                infoPemesanan.totalHarga, 'COD', filePath
            ]);
            const idPesananBaru = pesananResult.insertId;

            // 3. Masukkan setiap item obat ke tabel 'detail_pesanan'
            const detailSql = 'INSERT INTO detail_pesanan (id_pesanan, nama_obat, qty, harga_satuan, keterangan, satuan) VALUES ?';
            const detailValues = detailObat.map(item => [
                idPesananBaru, item.namaObat, item.qty, item.hargaSatuan, item.keterangan, item.satuan
            ]);
            await connection.query(detailSql, [detailValues]);

            await connection.commit();
            res.status(201).json({ success: true, message: 'Pesanan berhasil dibuat!', idPesanan: idPesananBaru });

        } catch (error) {
            await connection.rollback();
            console.error("Error in create pesanan:", error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            connection.release();
        }
    },
};

module.exports = pesananController;
