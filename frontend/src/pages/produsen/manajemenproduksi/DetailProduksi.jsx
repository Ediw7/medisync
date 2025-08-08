import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import qrcode from 'qrcode'; 

const DetailProduksi = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [produksi, setProduksi] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [qrCode, setQrCode] = useState('');

    useEffect(() => {
        const fetchProduksi = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login/produsen');
                return;
            }
            try {
                const response = await fetch(`http://localhost:5000/api/produksi/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Gagal mengambil data');
                const result = await response.json();
                setProduksi(result.data);

                 
                if (result.data && result.data.status === 'Tercatat di Blockchain') {
                    const qrUrl = await qrcode.toDataURL(result.data.batch_id);
                    setQrCode(qrUrl);
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduksi();
    }, [id, navigate]);
    
    const handleRecordToBlockchain = async () => {
        if (!window.confirm(`Anda yakin ingin mencatat Batch ID: ${produksi.batch_id} ke blockchain? Proses ini tidak bisa dibatalkan.`)) return;
        setIsRecording(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/produksi/${id}/record`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Gagal mencatat ke blockchain');
            
            alert(result.message);
            setProduksi({ ...produksi, status: 'Tercatat di Blockchain' });
            
            if (result.qrCodeDataUrl) {
                setQrCode(result.qrCodeDataUrl);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsRecording(false);
        }
    };

    if (isLoading) return <p className="p-6 text-center">Loading...</p>;
    if (error) return <p className="p-6 text-center text-red-500">{error}</p>;
    if (!produksi) return <p className="p-6 text-center">Data tidak ditemukan.</p>;

    const DetailItem = ({ label, value }) => (
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-gray-900 break-words">{value || '-'}</p>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SidebarProdusen isCollapsed={false} />
            <div className="flex-1 flex flex-col ml-64">
                <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
                <main className="pt-16 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Detail Produksi: {produksi.batch_id}</h1>
                        <button onClick={() => navigate('/produsen/riwayat-produksi')} className="bg-gray-200 text-gray-800 py-2 px-4 rounded">Kembali</button>
                    </div>
                    {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <DetailItem label="Batch ID" value={produksi.batch_id} />
                            <DetailItem label="Nama Obat" value={produksi.nama_obat} />
                            <DetailItem label="Nomor Izin Edar" value={produksi.nomor_izin_edar} />
                            <DetailItem label="Dosis" value={produksi.dosis} />
                            <DetailItem label="Jumlah" value={`${produksi.jumlah} pcs`} />
                            <DetailItem label="Status" value={produksi.status} />
                            <DetailItem label="Tanggal Produksi" value={new Date(produksi.tanggal_produksi).toLocaleDateString('id-ID')} />
                            <DetailItem label="Tanggal Kadaluarsa" value={new Date(produksi.tanggal_kadaluarsa).toLocaleDateString('id-ID')} />
                            <DetailItem label="Prioritas" value={produksi.prioritas} />
                            <div className="col-span-full"><DetailItem label="Komposisi" value={produksi.komposisi_obat} /></div>
                            <div className="col-span-full"><DetailItem label="Hash Sertifikat" value={produksi.hash_sertifikat_analisis} /></div>
                            <div className="col-span-full">
                                <p className="text-sm font-medium text-gray-500">Dokumen BPOM</p>
                                {produksi.dokumen_bpom_path ? <a href={`http://localhost:5000/${produksi.dokumen_bpom_path.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Lihat Dokumen</a> : '-'}
                            </div>
                            <div className="col-span-full">
                                <p className="text-sm font-medium text-gray-500">Sertifikat Analisis</p>
                                {produksi.sertifikat_analisis_path ? <a href={`http://localhost:5000/${produksi.sertifikat_analisis_path.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Lihat Dokumen</a> : '-'}
                            </div>
                        </div>
                        <div className="mt-6 border-t pt-6">
                            {produksi.status === 'Selesai' && (
                                <button 
                                    onClick={handleRecordToBlockchain}
                                    disabled={isRecording}
                                    className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 font-semibold"
                                >
                                    {isRecording ? 'Mencatat...' : 'Catat Batch ini ke Blockchain & Hasilkan QR Code'}
                                </button>
                            )}
                            
                            
                            {produksi.status === 'Tercatat di Blockchain' && (
                                <>
                                    <div className="p-4 text-center bg-green-100 text-green-800 rounded-lg">
                                        Batch ini sudah tercatat secara permanen di blockchain.
                                    </div>
                                    {qrCode && (
                                        <div className="mt-6 text-center p-4 border rounded-lg">
                                            <h3 className="font-semibold text-lg mb-2">QR Code</h3>
                                            <img src={qrCode} alt="QR Code" className="mx-auto" />
                                            <p className="text-xs text-gray-500 mt-2">Pindai untuk verifikasi. Berisi: {produksi.batch_id}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
export default DetailProduksi;