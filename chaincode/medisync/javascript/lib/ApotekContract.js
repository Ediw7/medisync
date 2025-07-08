'use strict';
const { Contract } = require('fabric-contract-api');

class ApotekContract extends Contract {
    constructor() {
        super('ApotekContract');
    }

    /**
     * Menandai obat telah terjual ke konsumen akhir.
     */
    async jualKeKonsumen(ctx, id, infoKonsumen) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'ApotekMSP') {
            throw new Error(`ERROR: Hanya Apotek yang bisa menjual ke konsumen.`);
        }
        
        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`ERROR: Obat dengan ID ${id} tidak ditemukan.`);
        }
        const obat = JSON.parse(assetJSON.toString());

        if (obat.pemilikSaatIni !== 'ApotekMSP') {
            throw new Error(`ERROR: Obat ini tidak dimiliki oleh Apotek.`);
        }

        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

        obat.pemilikSaatIni = infoKonsumen; // Pemilik sekarang adalah nama/ID konsumen
        obat.statusSaatIni = 'TERJUAL_KE_KONSUMEN';
        obat.riwayat.push({
            pemilik: infoKonsumen,
            status: 'TERJUAL_KE_KONSUMEN',
            timestamp: timestamp
        });

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
        return JSON.stringify(obat);
    }
}
module.exports = ApotekContract;
