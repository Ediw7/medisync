'use strict';
const { Contract } = require('fabric-contract-api');

class KonsumenContract extends Contract {
    constructor() {
        super('KonsumenContract');
    }

    async queryObat(ctx, id) {
        const obatAsBytes = await ctx.stub.getState(id);
        if (!obatAsBytes || obatAsBytes.length === 0) {
            throw new Error(`ERROR: Obat dengan ID ${id} tidak ditemukan.`);
        }
        return obatAsBytes.toString();
    }

    async queryRiwayatObat(ctx, id) {
        const iterator = await ctx.stub.getHistoryForKey(id);
        const allResults = [];
        
        let res = await iterator.next();
        while (!res.done) {
            if (res.value) {
                const txTimestamp = res.value.timestamp;
                let timestampStr = "N/A"; // Default value jika timestamp tidak ada
                
                // --- PERBAIKAN DI SINI ---
                // Cek apakah timestamp valid sebelum di-parsing
                if (txTimestamp && txTimestamp.seconds) {
                    // Konversi Long object ke number sebelum membuat Date
                    const seconds = Number(txTimestamp.seconds);
                    const nanos = Number(txTimestamp.nanos);
                    timestampStr = new Date(seconds * 1000 + nanos / 1000000).toISOString();
                }

                const obj = {
                    TxId: res.value.tx_id,
                    Timestamp: timestampStr, // Gunakan string yang sudah aman
                    Value: JSON.parse(res.value.value.toString('utf8')),
                    IsDelete: res.value.is_delete,
                };
                allResults.push(obj);
            }
            res = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(allResults);
    }
}
module.exports = KonsumenContract;
