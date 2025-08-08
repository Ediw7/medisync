'use strict';

const db = require('../../config/db');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const crypto = require('crypto');

// Fungsi untuk menghitung hash SHA-256 dari sebuah file
function calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (err) => reject(err));
    });
}

async function getGateway() {
    const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const gateway = new Gateway();
    const connectionOptions = {
        wallet,
        identity: 'admin',
        discovery: { enabled: false, asLocalhost: true }
    };
    await gateway.connect(ccp, connectionOptions);
    return gateway;
}

const produksiController = {
    getAll: async (req, res) => {
        try {
            // Ambil semua parameter filter dari query URL
            const { month, year, minJumlah, maxJumlah, sortBy, sortOrder } = req.query;
            
            // Mulai membangun query SQL
            let sql = 'SELECT * FROM produksi WHERE id_produsen = ?';
            const params = [req.user.id];

            // Tambahkan filter berdasarkan bulan dan tahun
            if (month && year) {
                sql += ' AND MONTH(tanggal_produksi) = ? AND YEAR(tanggal_produksi) = ?';
                params.push(month, year);
            }

            // Tambahkan filter berdasarkan rentang jumlah
            if (minJumlah) {
                sql += ' AND jumlah >= ?';
                params.push(minJumlah);
            }
            if (maxJumlah) {
                sql += ' AND jumlah <= ?';
                params.push(maxJumlah);
            }

            // Tambahkan pengurutan (sorting)
            const validSortColumns = ['batch_id', 'nama_obat', 'jumlah', 'tanggal_produksi', 'status'];
            const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'tanggal_produksi';
            const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
            sql += ` ORDER BY ${orderBy} ${orderDirection}`;

            const [rows] = await db.query(sql, params);
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error("Error in getAll with filters:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getById: async (req, res) => {
        try {
            const [rows] = await db.query('SELECT * FROM produksi WHERE id = ? AND id_produsen = ?', [req.params.id, req.user.id]);
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
            }
            res.json({ success: true, data: rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    create: async (req, res) => {
        const { batch_id, nama_obat, nomor_izin_edar, dosis, jumlah, tanggal_produksi, tanggal_kadaluarsa, prioritas, status, komposisi_obat } = req.body;
        const id_produsen = req.user.id;
        
        let dokumen_bpom_path = null;
        let sertifikat_analisis_path = null;
        let hash_sertifikat_analisis = null;

        try {
            // PERBAIKAN UTAMA: Mengambil file dari req.files (objek)
            if (req.files && req.files.dokumen_bpom) {
                dokumen_bpom_path = req.files.dokumen_bpom[0].path;
            }
            if (req.files && req.files.sertifikat_analisis) {
                sertifikat_analisis_path = req.files.sertifikat_analisis[0].path;
                hash_sertifikat_analisis = await calculateFileHash(sertifikat_analisis_path);
            }

            const [result] = await db.query(
                'INSERT INTO produksi (batch_id, nama_obat, nomor_izin_edar, dosis, jumlah, tanggal_produksi, tanggal_kadaluarsa, prioritas, status, komposisi_obat, dokumen_bpom_path, sertifikat_analisis_path, hash_sertifikat_analisis, id_produsen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [batch_id, nama_obat, nomor_izin_edar, dosis, jumlah, tanggal_produksi, tanggal_kadaluarsa, prioritas, status, komposisi_obat, dokumen_bpom_path, sertifikat_analisis_path, hash_sertifikat_analisis, id_produsen]
            );
            res.status(201).json({ success: true, message: 'Jadwal produksi berhasil dibuat', id: result.insertId });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Batch ID sudah ada.' });
            }
            res.status(500).json({ success: false, message: error.message });
        }
    },

    update: async (req, res) => {
        const { batch_id, nama_obat, nomor_izin_edar, dosis, jumlah, tanggal_produksi, tanggal_kadaluarsa, prioritas, status, komposisi_obat } = req.body;
        
        let dokumen_bpom_path = req.body.dokumen_bpom_path_existing || null;
        let sertifikat_analisis_path = req.body.sertifikat_analisis_path_existing || null;
        let hash_sertifikat_analisis = req.body.hash_sertifikat_analisis_existing || null;
        
        try {
            if (req.files && req.files.dokumen_bpom) {
                dokumen_bpom_path = req.files.dokumen_bpom[0].path;
            }
            if (req.files && req.files.sertifikat_analisis) {
                sertifikat_analisis_path = req.files.sertifikat_analisis[0].path;
                hash_sertifikat_analisis = await calculateFileHash(sertifikat_analisis_path);
            }
            
            const [result] = await db.query(
                'UPDATE produksi SET batch_id = ?, nama_obat = ?, nomor_izin_edar = ?, dosis = ?, jumlah = ?, tanggal_produksi = ?, tanggal_kadaluarsa = ?, prioritas = ?, status = ?, komposisi_obat = ?, dokumen_bpom_path = ?, sertifikat_analisis_path = ?, hash_sertifikat_analisis = ? WHERE id = ? AND id_produsen = ?',
                [batch_id, nama_obat, nomor_izin_edar, dosis, jumlah, tanggal_produksi, tanggal_kadaluarsa, prioritas, status, komposisi_obat, dokumen_bpom_path, sertifikat_analisis_path, hash_sertifikat_analisis, req.params.id, req.user.id]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Data tidak ditemukan atau Anda tidak berwenang' });
            }
            res.json({ success: true, message: 'Data produksi berhasil diperbarui' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

     delete: async (req, res) => {
        try {
            const [result] = await db.query('DELETE FROM produksi WHERE id = ? AND id_produsen = ?', [req.params.id, req.user.id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Data tidak ditemukan atau Anda tidak berwenang' });
            }
            res.json({ success: true, message: 'Data produksi berhasil dihapus' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    

    // Fungsi untuk mencatat ke blockchain
    recordToBlockchain: async (req, res) => {
        const { id } = req.params;
        const id_produsen = req.user.id;
        let gateway;
        let dbConnection;

        try {
            dbConnection = await db.getConnection();
            const [rows] = await dbConnection.query('SELECT * FROM produksi WHERE id = ? AND id_produsen = ?', [id, id_produsen]);
            
            if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data produksi tidak ditemukan.' });
            
            const prodData = rows[0];
            if (prodData.status === 'Tercatat di Blockchain') return res.status(400).json({ success: false, message: 'Batch ini sudah pernah dicatat.' });
            if (prodData.status !== 'Selesai') return res.status(400).json({ success: false, message: 'Hanya batch yang sudah Selesai yang bisa dicatat ke blockchain.' });

            gateway = await getGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            const contract = network.getContract('medisync');

            const transaction = contract.createTransaction('ProdusenContract:createObat');
            transaction.setEndorsingOrganizations('ProdusenMSP', 'PBFMSP');

            console.log('Submitting ON-CHAIN transaction for batch:', prodData.batch_id);
            
            await transaction.submit(
                prodData.batch_id,
                prodData.nama_obat,
                prodData.nomor_izin_edar || 'TIDAK ADA DATA',
                prodData.komposisi_obat || '',
                prodData.dosis || 'N/A',
                new Date(prodData.tanggal_produksi).toISOString().split('T')[0],
                new Date(prodData.tanggal_kadaluarsa).toISOString().split('T')[0],
                prodData.hash_sertifikat_analisis || 'TIDAK ADA HASH'
            );
            console.log('ON-CHAIN transaction successful.');

            await dbConnection.query('UPDATE produksi SET status = ? WHERE id = ?', ['Tercatat di Blockchain', id]);
            console.log('OFF-CHAIN status updated.');

            const qrCodeDataUrl = await qrcode.toDataURL(prodData.batch_id);

            res.json({ 
                success: true, 
                message: `Batch ${prodData.batch_id} berhasil dicatat ke blockchain.`,
                qrCodeDataUrl: qrCodeDataUrl
            });

        } catch (error) {
            console.error("Error recording to blockchain:", error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            if (gateway) gateway.disconnect();
            if (dbConnection) dbConnection.release();
        }
    }
};

module.exports = produksiController;
