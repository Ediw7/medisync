'use strict';
const { Contract } = require('fabric-contract-api');

class ProdusenContract extends Contract {
    constructor() { super('ProdusenContract'); }

    async createObat(ctx, id, nama, batch, tanggalKadaluarsa) {
        // ... (logika createObat yang sudah kita perbaiki sebelumnya) ...
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'ProdusenMSP') {
            throw new Error(`ERROR: Organisasi ${mspID} tidak diizinkan.`);
        }
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
        const obat = { id, nama, batch, tanggalKadaluarsa, pemilik: mspID, status: 'DIPRODUKSI', riwayat: [{ pemilik: mspID, status: 'DIPRODUKSI', timestamp }] };
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
        return JSON.stringify(obat);
    }

    async transferToPbf(ctx, id, pbfMspId) {
        if (pbfMspId !== 'PBFMSP') { throw new Error('Obat hanya bisa ditransfer ke PBFMSP'); }
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'ProdusenMSP') { throw new Error(`ERROR: Hanya Produsen yang bisa mentransfer ke PBF.`); }

        const obatAsBytes = await ctx.stub.getState(id);
        if (!obatAsBytes || obatAsBytes.length === 0) { throw new Error(`ERROR: Obat ${id} tidak ditemukan.`); }

        const obat = JSON.parse(obatAsBytes.toString());
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

        obat.pemilik = pbfMspId;
        obat.status = 'DIKIRIM_KE_PBF';
        obat.riwayat.push({ pemilik: pbfMspId, status: obat.status, timestamp });

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
        return JSON.stringify(obat);
    }
}
module.exports = ProdusenContract;