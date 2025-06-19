'use strict';

const { Contract } = require('fabric-contract-api');

class MedisyncContract extends Contract {

    constructor() {
        super('org.medisync.MedisyncContract');
    }

    // Fungsi untuk membuat aset obat baru
    async createObat(ctx, id, nama, batch, tanggalKadaluarsa) {
        const MspID = ctx.clientIdentity.getMSPID();
        if (MspID !== 'ProdusenMSP') {
            throw new Error(`\nERROR: Organisasi ${MspID} tidak diizinkan untuk membuat obat baru.`);
        }

        // --- PERBAIKAN DI SINI ---
        // Ambil timestamp dari transaksi, bukan dari new Date()
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

        const obat = {
            id: id,
            nama: nama,
            batch: batch,
            tanggalKadaluarsa: tanggalKadaluarsa,
            pemilik: MspID,
            status: 'DIPRODUKSI',
            riwayat: [
                {
                    pemilik: MspID,
                    status: 'DIPRODUKSI',
                    timestamp: timestamp // Gunakan timestamp dari transaksi
                }
            ]
        };

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
        return JSON.stringify(obat);
    }

    // Fungsi untuk mentransfer kepemilikan obat
    async transferObat(ctx, id, pemilikBaruMSP) {
        const obatAsBytes = await ctx.stub.getState(id);
        if (!obatAsBytes || obatAsBytes.length === 0) {
            throw new Error(`\nERROR: Obat dengan ID ${id} tidak ditemukan.`);
        }

        const obat = JSON.parse(obatAsBytes.toString());
        const MspIDPemilikSaatIni = ctx.clientIdentity.getMSPID();

        if (obat.pemilik !== MspIDPemilikSaatIni) {
            throw new Error(`\nERROR: Organisasi ${MspIDPemilikSaatIni} bukan pemilik saat ini dari obat ${id}.`);
        }

        let statusBaru = '';
        if (obat.pemilik === 'ProdusenMSP' && pemilikBaruMSP === 'PBFMSP') {
            statusBaru = 'DIKIRIM_KE_PBF';
        } else if (obat.pemilik === 'PBFMSP' && pemilikBaruMSP === 'ApotekMSP') {
            statusBaru = 'DITERIMA_APOTEK';
        } else {
            throw new Error(`\nERROR: Transfer dari ${obat.pemilik} ke ${pemilikBaruMSP} tidak valid.`);
        }

        // --- PERBAIKAN DI SINI ---
        // Ambil timestamp dari transaksi
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
        
        obat.pemilik = pemilikBaruMSP;
        obat.status = statusBaru;
        
        obat.riwayat.push({
            pemilik: pemilikBaruMSP,
            status: statusBaru,
            timestamp: timestamp // Gunakan timestamp dari transaksi
        });

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
        return JSON.stringify(obat);
    }

    // Fungsi untuk query (membaca) data obat berdasarkan ID
    async queryObat(ctx, id) {
        const obatAsBytes = await ctx.stub.getState(id);
        if (!obatAsBytes || obatAsBytes.length === 0) {
            throw new Error(`\nERROR: Obat dengan ID ${id} tidak ditemukan.`);
        }
        return obatAsBytes.toString();
    }

    // Fungsi untuk query riwayat transaksi sebuah obat
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

module.exports = MedisyncContract;