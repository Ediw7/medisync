'use strict';
const { Contract } = require('fabric-contract-api');

class PbfContract extends Contract {
    constructor() { super('PbfContract'); }

    async transferToApotek(ctx, id, hashSuratJalanBaru) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'PBFMSP') {
            throw new Error(`ERROR: Hanya PBF yang bisa mentransfer ke Apotek.`);
        }

        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`ERROR: Obat dengan ID ${id} tidak ditemukan.`);
        }
        const obat = JSON.parse(assetJSON.toString());

        if (obat.pemilikSaatIni !== 'PBFMSP') {
            throw new Error(`ERROR: Obat ini tidak dimiliki oleh PBF.`);
        }
        
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

        obat.pemilikSaatIni = 'ApotekMSP';
        obat.statusSaatIni = 'DIKIRIM_KE_APOTEK';
        obat.hashDokumen.suratJalan = hashSuratJalanBaru;
        obat.riwayat.push({
            pemilik: 'ApotekMSP',
            status: 'DIKIRIM_KE_APOTEK',
            timestamp: timestamp,
            detail: `Surat Jalan hash: ${hashSuratJalanBaru}`
        });

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
        return JSON.stringify(obat);
    }
}
module.exports = PbfContract;
