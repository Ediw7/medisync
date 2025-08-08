import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const EditProduksi = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [formData, setFormData] = useState(null); // Mulai dari null untuk menandakan data belum ada
    const [dokumenBpomFile, setDokumenBpomFile] = useState(null);
    const [sertifikatFile, setSertifikatFile] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProduksi = async () => {
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
                const data = result.data;
                // Mengkonversi string tanggal dari DB menjadi objek Date untuk DatePicker
                setFormData({
                    ...data,
                    tanggal_produksi: data.tanggal_produksi ? new Date(data.tanggal_produksi) : null,
                    tanggal_kadaluarsa: data.tanggal_kadaluarsa ? new Date(data.tanggal_kadaluarsa) : null
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduksi();
    }, [id, navigate]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const data = new FormData();

        // Append semua field teks dari formData
        Object.keys(formData).forEach(key => {
            if (key === 'tanggal_produksi' || key === 'tanggal_kadaluarsa') {
                if (formData[key]) {
                    data.append(key, formData[key].toISOString().split('T')[0]);
                }
            } else if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
                 data.append(key, formData[key] || ''); // Kirim string kosong jika null/undefined
            }
        });

        // Append file baru jika ada
        if (dokumenBpomFile) {
            data.append('dokumen_bpom', dokumenBpomFile);
        }
        if (sertifikatFile) {
            data.append('sertifikat_analisis', sertifikatFile);
        }

        try {
            const response = await fetch(`http://localhost:5000/api/produksi/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Gagal mengupdate data');
            navigate('/produsen/manajemen-produksi');
        } catch (err) {
            setError(err.message);
        }
    };

    if (isLoading || !formData) return <div className="p-6 text-center">Loading...</div>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
                <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
                <main className="pt-16 p-6">
                    <h1 className="text-2xl font-bold mb-6">Edit Jadwal Produksi</h1>
                    {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4 max-w-4xl mx-auto">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="batch_id" value={formData.batch_id} onChange={handleInputChange} placeholder="Batch ID Unik" required className="w-full p-2 border rounded"/>
                            <input name="nama_obat" value={formData.nama_obat} onChange={handleInputChange} placeholder="Nama Obat" required className="w-full p-2 border rounded"/>
                            <input name="nomor_izin_edar" value={formData.nomor_izin_edar || ''} onChange={handleInputChange} placeholder="Nomor Izin Edar (NIE)" className="w-full p-2 border rounded"/>
                            <input name="dosis" value={formData.dosis || ''} onChange={handleInputChange} placeholder="Dosis (cth: 500mg)" className="w-full p-2 border rounded"/>
                            <input type="number" name="jumlah" value={formData.jumlah} onChange={handleInputChange} placeholder="Jumlah Produksi (pcs)" required className="w-full p-2 border rounded"/>
                            <select name="prioritas" value={formData.prioritas} onChange={handleInputChange} className="w-full p-2 border rounded">
                                <option value="High">Prioritas Tinggi</option>
                                <option value="Medium">Prioritas Sedang</option>
                                <option value="Low">Prioritas Rendah</option>
                            </select>
                            <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border rounded">
                                <option value="Terjadwal">Terjadwal</option>
                                <option value="Dalam Produksi">Dalam Produksi</option>
                                <option value="Selesai">Selesai</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label>Tanggal Produksi:</label>
                                <DatePicker selected={formData.tanggal_produksi} onChange={(date) => setFormData({...formData, tanggal_produksi: date})} dateFormat="dd/MM/yyyy" className="w-full p-2 border rounded"/>
                            </div>
                            <div>
                                <label>Tanggal Kadaluarsa:</label>
                                <DatePicker selected={formData.tanggal_kadaluarsa} onChange={(date) => setFormData({...formData, tanggal_kadaluarsa: date})} dateFormat="dd/MM/yyyy" className="w-full p-2 border rounded"/>
                            </div>
                        </div>
                        <textarea name="komposisi_obat" value={formData.komposisi_obat || ''} onChange={handleInputChange} placeholder="Komposisi Obat" className="w-full p-2 border rounded"/>
                        <div>
                            <label>Sertifikat Analisis (Upload baru untuk mengganti)</label>
                            <input type="file" name="sertifikat_analisis" onChange={(e) => setSertifikatFile(e.target.files[0])} className="w-full p-2 border rounded"/>
                            {formData.sertifikat_analisis_path && !sertifikatFile && <p className="text-sm text-gray-500 mt-1">File saat ini: {formData.sertifikat_analisis_path.replace('uploads\\', '')}</p>}
                        </div>
                        <div>
                            <label>Dokumen BPOM (Upload baru untuk mengganti)</label>
                            <input type="file" name="dokumen_bpom" onChange={(e) => setDokumenBpomFile(e.target.files[0])} className="w-full p-2 border rounded"/>
                            {formData.dokumen_bpom_path && !dokumenBpomFile && <p className="text-sm text-gray-500 mt-1">File saat ini: {formData.dokumen_bpom_path.replace('uploads\\', '')}</p>}
                        </div>
                        <div className="flex justify-end space-x-4 pt-4">
                            <button type="button" onClick={() => navigate('/produsen/manajemen-produksi')} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100">Batal</button>
                            <button type="submit" className="px-4 py-2 bg-[#18A375] text-white rounded hover:bg-[#158c63]">Simpan Perubahan</button>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
};
export default EditProduksi;