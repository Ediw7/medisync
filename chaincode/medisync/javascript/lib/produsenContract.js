'use strict';
const { Contract } = require('fabric-contract-api');

class ProdusenContract extends Contract {
    constructor() { super('ProdusenContract'); }

    async assetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    async createObat(ctx, id, namaObat, nomorIzinEdar, komposisi, dosis, tanggalProduksi, tanggalKadaluarsa, hashSertifikatAnalisis) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'ProdusenMSP') {
            throw new Error(`ERROR: Organisasi ${mspID} tidak diizinkan untuk membuat aset obat.`);
        }

        const exists = await this.assetExists(ctx, id);
        if (exists) {
            throw new Error(`ERROR: Obat dengan ID Batch ${id} sudah ada.`);
        }

        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

        const obat = {
            docType: 'obat',
            id: id,
            namaObat: namaObat,
            nomorIzinEdar: nomorIzinEdar,
            komposisi: komposisi,
            dosis: dosis,
            tanggalProduksi: tanggalProduksi,
            tanggalKadaluarsa: tanggalKadaluarsa,
            pemilikSaatIni: mspID,
            statusSaatIni: 'DIPRODUKSI',
            hashDokumen: {
                sertifikatAnalisis: hashSertifikatAnalisis,
                suratJalan: ''
            },
            riwayat: [{
                pemilik: mspID,
                status: 'DIPRODUKSI',
                timestamp: timestamp
            }]
        };

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
        return JSON.stringify(obat);
    }

    async transferToPbf(ctx, id, hashSuratJalan) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'ProdusenMSP') {
            throw new Error(`ERROR: Hanya Produsen yang bisa mentransfer ke PBF.`);
        }

        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`ERROR: Obat dengan ID ${id} tidak ditemukan.`);
        }
        const obat = JSON.parse(assetJSON.toString());

        if (obat.pemilikSaatIni !== 'ProdusenMSP') {
            throw new Error(`ERROR: Obat ini tidak dimiliki oleh Produsen.`);
        }

        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
        
        obat.pemilikSaatIni = 'PBFMSP';
        obat.statusSaatIni = 'DIKIRIM_KE_PBF';
        obat.hashDokumen.suratJalan = hashSuratJalan;
        obat.riwayat.push({
            pemilik: 'PBFMSP',
            status: 'DIKIRIM_KE_PBF',
            timestamp: timestamp,
            detail: `Surat Jalan hash: ${hashSuratJalan}`
        });
        
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
        return JSON.stringify(obat);
    }
}
module.exports = ProdusenContract;
