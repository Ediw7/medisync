'use strict';
const { Contract } = require('fabric-contract-api');

// Pastikan nama Class sudah benar
class ApotekContract extends Contract {
    
    // Pastikan nama Kontrak di dalam super() sudah benar
    constructor() {
        super('ApotekContract');
    }

    /**
     * Fungsi untuk menandai obat telah terjual ke konsumen akhir.
     * Hanya bisa dipanggil oleh identitas dari ApotekMSP.
     */
    async jualKeKonsumen(ctx, id, namaKonsumen) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'ApotekMSP') {
            throw new Error(`ERROR: Hanya Apotek yang bisa menjual ke konsumen.`);
        }
        
        const obatAsBytes = await ctx.stub.getState(id);
        if (!obatAsBytes || obatAsBytes.length === 0) {
            throw new Error(`ERROR: Obat dengan ID ${id} tidak ditemukan.`);
        }

        const obat = JSON.parse(obatAsBytes.toString());

        // Validasi tambahan: pastikan obat dimiliki oleh apotek sebelum dijual
        if (obat.pemilik !== 'ApotekMSP') {
            throw new Error(`ERROR: Obat ini tidak dimiliki oleh ApotekMSP, tetapi oleh ${obat.pemilik}.`);
        }

        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

        obat.pemilik = namaKonsumen; // Pemilik sekarang adalah nama individu konsumen
        obat.status = 'TERJUAL_KE_KONSUMEN';
        obat.riwayat.push({ pemilik: namaKonsumen, status: obat.status, timestamp });

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
        return JSON.stringify(obat);
    }

    // Anda bisa menambahkan fungsi lain khusus untuk Apotek di sini di masa depan
    // Contoh:
    // async terimaObat(ctx, id) { ... }
}

module.exports = ApotekContract;
