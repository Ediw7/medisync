'use strict';
const { Contract } = require('fabric-contract-api');

class KonsumenContract extends Contract {
    constructor() { super('KonsumenContract'); }

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
                const obj = {
                    TxId: res.value.tx_id,
                    Timestamp: new Date(res.value.timestamp.seconds.low * 1000).toISOString(),
                    Value: JSON.parse(res.value.value.toString('utf8')),
                    IsDelete: res.value.is_delete,
                };
                allResults.push(obj);
            }
            res = await iterator.next();
        }
        iterator.close();
        return JSON.stringify(allResults);
    }
}
module.exports = KonsumenContract;