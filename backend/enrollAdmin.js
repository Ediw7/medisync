'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // Muat profil koneksi
        const ccpPath = path.resolve(__dirname, 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Buat wallet untuk menyimpan identitas
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Cek apakah admin sudah ada di wallet
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        // Dapatkan path ke material kripto admin
        const adminCertPath = path.resolve(__dirname, '../organizations/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp/signcerts/Admin@org1.medisync.com-cert.pem');
        const adminKeyPath = path.resolve(__dirname, '../organizations/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp/keystore/');
        
        const certificate = fs.readFileSync(adminCertPath).toString();
        // Temukan file kunci privat secara dinamis
        const keyFile = fs.readdirSync(adminKeyPath)[0];
        const privateKey = fs.readFileSync(path.resolve(adminKeyPath, keyFile)).toString();

        // Buat identitas X.509 baru
        const x509Identity = {
            credentials: {
                certificate: certificate,
                privateKey: privateKey,
            },
            mspId: 'ProdusenMSP',
            type: 'X.509',
        };

        // Masukkan identitas admin baru ke dalam wallet
        await wallet.put('admin', x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }
}

main();
