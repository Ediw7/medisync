'use strict';
const { Contract } = require('fabric-contract-api');

class PbfContract extends Contract {
    constructor() { super('PbfContract'); }

    async transferToApotek(ctx, id, apotekMspId) {
        if (apotekMspId !== 'ApotekMSP') { throw new Error('Obat hanya bisa ditransfer ke ApotekMSP'); }
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'PBFMSP') { throw new Error(`ERROR: Hanya PBF yang bisa mentransfer ke Apotek.`); }

        const obatAsBytes = await ctx.stub.getState(id);
        if (!obatAsBytes || obatAsBytes.length === 0) { throw new Error(`ERROR: Obat ${id} tidak ditemukan.`); }

        const obat = JSON.parse(obatAsBytes.toString());
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

        obat.pemilik = apotekMspId;
        obat.status = 'DITERIMA_APOTEK';
        obat.riwayat.push({ pemilik: apotekMspId, status: obat.status, timestamp });

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
        return JSON.stringify(obat);
    }
}
module.exports = PbfContract;