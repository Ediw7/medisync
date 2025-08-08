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

// Fungsi helper untuk koneksi ke gateway
async function getGateway() {
  const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org1.json');
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  const gateway = new Gateway();
  const connectionOptions = {
    wallet,
    identity: 'admin',
    discovery: { enabled: false, asLocalhost: true },
  };
  await gateway.connect(ccp, connectionOptions);
  return gateway;
}

const produksiController = {
  // Mengambil semua jadwal produksi milik produsen yang sedang login
  getAll: async (req, res) => {
    try {
      const [rows] = await db.query(
        'SELECT id, batch_id, nama_obat, jumlah, status, tanggal_produksi FROM produksi WHERE id_produsen = ? ORDER BY tanggal_produksi DESC',
        [req.user.id]
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error in getAll:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // Mengambil satu data produksi berdasarkan ID
  getById: async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM produksi WHERE id = ? AND id_produsen = ?', [
        req.params.id,
        req.user.id,
      ]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
      }
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error in getById:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // Membuat jadwal produksi baru
  create: async (req, res) => {
    const {
      batch_id,
      nama_obat,
      nomor_izin_edar,
      dosis,
      bentuk_sediaan,
      jumlah,
      tanggal_produksi,
      tanggal_kadaluarsa,
      prioritas,
      status,
      komposisi_obat,
      penanggung_jawab,
    } = req.body;
    const id_produsen = req.user.id;

    // Validasi field wajib
    if (!batch_id || !nama_obat || !jumlah || !tanggal_produksi || !tanggal_kadaluarsa) {
      return res.status(400).json({
        success: false,
        message: 'Batch ID, Nama Obat, Jumlah, Tanggal Produksi, dan Tanggal Kadaluarsa wajib diisi.',
      });
    }
    if (!bentuk_sediaan) {
      return res.status(400).json({ success: false, message: 'Bentuk sediaan wajib diisi.' });
    }
    if (!penanggung_jawab) {
      return res.status(400).json({ success: false, message: 'Penanggung jawab wajib diisi.' });
    }
    if (Number(jumlah) <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah produksi harus lebih dari 0.' });
    }
    if (new Date(tanggal_kadaluarsa) <= new Date(tanggal_produksi)) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal kadaluarsa harus setelah tanggal produksi.',
      });
    }

    let dokumen_bpom_path = null;
    let sertifikat_analisis_path = null;
    let hash_sertifikat_analisis = null;

    try {
      if (req.files && req.files.dokumen_bpom) {
        dokumen_bpom_path = req.files.dokumen_bpom[0].path;
      }
      if (req.files && req.files.sertifikat_analisis) {
        sertifikat_analisis_path = req.files.sertifikat_analisis[0].path;
        hash_sertifikat_analisis = await calculateFileHash(sertifikat_analisis_path);
      }

      const sql = `INSERT INTO produksi (
        batch_id, nama_obat, nomor_izin_edar, dosis, bentuk_sediaan, jumlah,
        tanggal_produksi, tanggal_kadaluarsa, prioritas, status, komposisi_obat,
        dokumen_bpom_path, sertifikat_analisis_path, hash_sertifikat_analisis, penanggung_jawab, id_produsen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const params = [
        batch_id,
        nama_obat,
        nomor_izin_edar || null,
        dosis || null,
        bentuk_sediaan,
        jumlah,
        tanggal_produksi,
        tanggal_kadaluarsa,
        prioritas || 'Medium',
        status || 'Terjadwal',
        komposisi_obat || null,
        dokumen_bpom_path,
        sertifikat_analisis_path,
        hash_sertifikat_analisis,
        penanggung_jawab,
        id_produsen,
      ];

      const [result] = await db.query(sql, params);
      res.status(201).json({ success: true, message: 'Jadwal produksi berhasil dibuat', id: result.insertId });
    } catch (error) {
      console.error('Error in create:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Batch ID sudah ada.' });
      }
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // Mengupdate data produksi
  update: async (req, res) => {
    const {
      batch_id,
      nama_obat,
      nomor_izin_edar,
      dosis,
      bentuk_sediaan,
      jumlah,
      tanggal_produksi,
      tanggal_kadaluarsa,
      prioritas,
      status,
      komposisi_obat,
      penanggung_jawab,
    } = req.body;

    // Validasi field wajib
    if (!batch_id || !nama_obat || !jumlah || !tanggal_produksi || !tanggal_kadaluarsa) {
      return res.status(400).json({
        success: false,
        message: 'Batch ID, Nama Obat, Jumlah, Tanggal Produksi, dan Tanggal Kadaluarsa wajib diisi.',
      });
    }
    if (!bentuk_sediaan) {
      return res.status(400).json({ success: false, message: 'Bentuk sediaan wajib diisi.' });
    }
    if (!penanggung_jawab) {
      return res.status(400).json({ success: false, message: 'Penanggung jawab wajib diisi.' });
    }
    if (Number(jumlah) <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah produksi harus lebih dari 0.' });
    }
    if (new Date(tanggal_kadaluarsa) <= new Date(tanggal_produksi)) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal kadaluarsa harus setelah tanggal produksi.',
      });
    }

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

      const sql = `UPDATE produksi SET 
        batch_id = ?, nama_obat = ?, nomor_izin_edar = ?, dosis = ?, bentuk_sediaan = ?, jumlah = ?,
        tanggal_produksi = ?, tanggal_kadaluarsa = ?, prioritas = ?, status = ?, komposisi_obat = ?,
        dokumen_bpom_path = ?, sertifikat_analisis_path = ?, hash_sertifikat_analisis = ?, penanggung_jawab = ?
        WHERE id = ? AND id_produsen = ?`;

      const params = [
        batch_id,
        nama_obat,
        nomor_izin_edar || null,
        dosis || null,
        bentuk_sediaan,
        jumlah,
        tanggal_produksi,
        tanggal_kadaluarsa,
        prioritas || 'Medium',
        status || 'Terjadwal',
        komposisi_obat || null,
        dokumen_bpom_path,
        sertifikat_analisis_path,
        hash_sertifikat_analisis,
        penanggung_jawab,
        req.params.id,
        req.user.id,
      ];

      const [result] = await db.query(sql, params);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan atau Anda tidak berwenang' });
      }
      res.json({ success: true, message: 'Data produksi berhasil diperbarui' });
    } catch (error) {
      console.error('Error in update:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // Menghapus data produksi
  delete: async (req, res) => {
    try {
      const [result] = await db.query('DELETE FROM produksi WHERE id = ? AND id_produsen = ?', [
        req.params.id,
        req.user.id,
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan atau Anda tidak berwenang' });
      }
      res.json({ success: true, message: 'Data produksi berhasil dihapus' });
    } catch (error) {
      console.error('Error in delete:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
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
      const [rows] = await dbConnection.query('SELECT * FROM produksi WHERE id = ? AND id_produsen = ?', [
        id,
        id_produsen,
      ]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data produksi tidak ditemukan.' });
      }

      const prodData = rows[0];

      // Validasi status
      if (prodData.status === 'Tercatat di Blockchain') {
        return res.status(400).json({ success: false, message: 'Batch ini sudah pernah dicatat.' });
      }
      if (prodData.status !== 'Selesai') {
        return res.status(400).json({ success: false, message: 'Hanya batch yang sudah Selesai yang bisa dicatat ke blockchain.' });
      }

      // Validasi data penting untuk blockchain
      if (!prodData.bentuk_sediaan) {
        return res.status(400).json({ success: false, message: 'Bentuk sediaan wajib diisi untuk pencatatan blockchain.' });
      }
      if (!prodData.penanggung_jawab) {
        return res.status(400).json({ success: false, message: 'Penanggung jawab wajib diisi untuk pencatatan blockchain.' });
      }

      gateway = await getGateway();
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');

      const transaction = contract.createTransaction('ProdusenContract:createObat');
      transaction.setEndorsingOrganizations('ProdusenMSP', 'PBFMSP');

      console.log('Submitting ON-CHAIN transaction for batch:', prodData.batch_id);

      // Tambahkan bentuk_sediaan dan penanggung_jawab ke transaksi blockchain
      await transaction.submit(
        prodData.batch_id,
        prodData.nama_obat,
        prodData.nomor_izin_edar || 'TIDAK ADA DATA',
        prodData.komposisi_obat || '',
        prodData.dosis || 'N/A',
        new Date(prodData.tanggal_produksi).toISOString().split('T')[0],
        new Date(prodData.tanggal_kadaluarsa).toISOString().split('T')[0],
        prodData.bentuk_sediaan,
        prodData.penanggung_jawab,
        prodData.hash_sertifikat_analisis || 'TIDAK ADA HASH'
      );
      console.log('ON-CHAIN transaction successful.');

      // Update status di database
      await dbConnection.query('UPDATE produksi SET status = ? WHERE id = ?', ['Tercatat di Blockchain', id]);
      console.log('OFF-CHAIN status updated.');

      // Generate QR code dengan data tambahan
      const qrData = JSON.stringify({
        batch_id: prodData.batch_id,
        nama_obat: prodData.nama_obat,
        bentuk_sediaan: prodData.bentuk_sediaan,
        penanggung_jawab: prodData.penanggung_jawab,
      });
      const qrCodeDataUrl = await qrcode.toDataURL(qrData);

      res.json({
        success: true,
        message: `Batch ${prodData.batch_id} berhasil dicatat ke blockchain.`,
        qrCodeDataUrl: qrCodeDataUrl,
      });
    } catch (error) {
      console.error('Error recording to blockchain:', error);
      res.status(500).json({ success: false, message: `Gagal mencatat ke blockchain: ${error.message}` });
    } finally {
      if (gateway) gateway.disconnect();
      if (dbConnection) dbConnection.release();
    }
  },
};

module.exports = produksiController;