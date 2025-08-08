'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');

const CHANNEL_NAME = 'medisyncchannel';
const CONTRACT_NAME = 'medisync';

// Fungsi helper untuk koneksi ke gateway
async function getGateway() {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const ccpPath = path.resolve(__dirname, '..', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });
    return gateway;
}

const blockchainController = {
    // Fungsi untuk query data obat
    queryObatById: async (req, res) => {
        let gateway;
        try {
            gateway = await getGateway();
            const network = await gateway.getNetwork(CHANNEL_NAME);
            const contract = network.getContract(CONTRACT_NAME);

            console.log(`Querying for obat with ID: ${req.params.id}`);
            const result = await contract.evaluateTransaction('KonsumenContract:queryObat', req.params.id);
            
            res.status(200).json(JSON.parse(result.toString()));
        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
            res.status(500).json({ error: error.message });
        } finally {
            if (gateway) gateway.disconnect();
        }
    },

    // Fungsi untuk membuat obat baru
    createObat: async (req, res) => {
        let gateway;
        try {
            // Mengambil semua argumen dari body
            const { id, namaObat, nomorIzinEdar, komposisi, dosis, tanggalProduksi, tanggalKadaluarsa, hashSertifikatAnalisis } = req.body;
            
            if (!id || !namaObat || !nomorIzinEdar || !tanggalKadaluarsa) {
                return res.status(400).json({ error: 'Data on-chain tidak lengkap.' });
            }

            gateway = await getGateway();
            const network = await gateway.getNetwork(CHANNEL_NAME);
            const contract = network.getContract(CONTRACT_NAME);
            
            console.log('Submitting ON-CHAIN transaction to create new obat...');
            await contract.submitTransaction(
                'ProdusenContract:createObat',
                id, namaObat, nomorIzinEdar, komposisi, dosis, tanggalProduksi, tanggalKadaluarsa, hashSertifikatAnalisis
            );
            
            // TODO: Simpan data off-chain ke MariaDB di sini jika perlu

            const qrCodeData = await qrcode.toDataURL(id);

            res.status(201).json({
                message: `Obat dengan ID ${id} berhasil dibuat`,
                qrCodeDataUrl: qrCodeData
            });
        } catch (error) {
            console.error(`Failed to submit transaction: ${error}`);
            res.status(500).json({ error: error.message });
        } finally {
            if (gateway) gateway.disconnect();
        }
    }
};

module.exports = blockchainController;
