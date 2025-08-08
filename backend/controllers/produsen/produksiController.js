'use strict';

const db = require('../../config/db');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');

async function getGateway() {
    const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const gateway = new Gateway();
    // Gunakan koneksi langsung tanpa discovery untuk menghindari masalah TLS yang kompleks
    const connectionOptions = {
        wallet,
        identity: 'admin',
        discovery: { enabled: false, asLocalhost: true }
    };
    await gateway.connect(ccp, connectionOptions);
    return gateway;
}

const produksiController = {
    // CRUD Off-chain (getAll, getById, create, update, delete)
    getAll: async (req, res) => {
        try {
            const [rows] = await db.query('SELECT * FROM produksi WHERE id_produsen = ? ORDER BY tanggal_produksi DESC', [req.user.id]);
            res.json({ success: true, data: rows });
        } catch (error) {
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
        const { batch_id, nama_obat, jumlah, tanggal_produksi, tanggal_kadaluarsa, prioritas, status, komposisi_obat } = req.body;
        const id_produsen = req.user.id;
        const dokumen_bpom = req.file ? req.file.path : null;

        try {
            const [result] = await db.query(
                'INSERT INTO produksi (batch_id, nama_obat, jumlah, tanggal_produksi, tanggal_kadaluarsa, prioritas, status, komposisi_obat, dokumen_bpom, id_produsen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [batch_id, nama_obat, jumlah, tanggal_produksi, tanggal_kadaluarsa, prioritas, status, komposisi_obat, dokumen_bpom, id_produsen]
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
        const { batch_id, nama_obat, jumlah, tanggal_produksi, tanggal_kadaluarsa, prioritas, status, komposisi_obat } = req.body;
        const dokumen_bpom = req.file ? req.file.path : req.body.dokumen_bpom_existing;
        
        try {
            const [result] = await db.query(
                'UPDATE produksi SET batch_id = ?, nama_obat = ?, jumlah = ?, tanggal_produksi = ?, tanggal_kadaluarsa = ?, prioritas = ?, status = ?, komposisi_obat = ?, dokumen_bpom = ? WHERE id = ? AND id_produsen = ?',
                [batch_id, nama_obat, jumlah, tanggal_produksi, tanggal_kadaluarsa, prioritas, status, komposisi_obat, dokumen_bpom, req.params.id, req.user.id]
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
            
            // --- PERBAIKAN UTAMA DI SINI ---
            // Nama chaincode harus 'medisync', sesuai dengan yang ada di network.sh
            const contract = network.getContract('medisync');

            const transaction = contract.createTransaction('ProdusenContract:createObat');
            transaction.setEndorsingOrganizations('ProdusenMSP', 'PBFMSP');

            console.log('Submitting ON-CHAIN transaction for batch:', prodData.batch_id);
            await transaction.submit(
                prodData.batch_id,
                prodData.nama_obat,
                'DUMMY-NIE-123',
                prodData.komposisi_obat || '',
                'N/A',
                new Date(prodData.tanggal_produksi).toISOString().split('T')[0],
                new Date(prodData.tanggal_kadaluarsa).toISOString().split('T')[0],
                'dummy_hash_sertifikat'
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
