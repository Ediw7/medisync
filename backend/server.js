'use strict';

const express = require('express');
const cors = require('cors');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const CHANNEL_NAME = 'medisyncchannel';
const CONTRACT_NAME = 'medisync';

// Fungsi helper untuk koneksi ke gateway
async function getGateway() {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const ccpPath = path.resolve(__dirname, 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });
    return gateway;
}

// Endpoint untuk query data obat berdasarkan ID
app.get('/api/obat/:id', async (req, res) => {
    try {
        const gateway = await getGateway();
        const network = await gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CONTRACT_NAME);

        console.log(`Querying for obat with ID: ${req.params.id}`);
        const result = await contract.evaluateTransaction('queryObat', req.params.id);
        
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        res.status(200).json(JSON.parse(result.toString()));
        gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint untuk membuat obat baru
app.post('/api/obat', async (req, res) => {
    try {
        const { id, nama, batch, tanggalKadaluarsa } = req.body;
        if (!id || !nama || !batch || !tanggalKadaluarsa) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const gateway = await getGateway();
        const network = await gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CONTRACT_NAME);
        
        console.log('Submitting transaction to create new obat...');
        await contract.submitTransaction('createObat', id, nama, batch, tanggalKadaluarsa);
        
        console.log('Transaction has been submitted');
        
        // TODO: Di sinilah Anda akan menyimpan data ke database MySQL off-chain jika diperlukan
        // Contoh: await mysql.query('INSERT INTO obat_offchain ...');

        res.status(201).json({ message: `Obat with ID ${id} created successfully` });
        gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: error.message });
    }
});


// Jalankan server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
