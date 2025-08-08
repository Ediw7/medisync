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
    const [formData, setFormData] = useState({
        batch_id: '',
        nama_obat: '',
        jumlah: '',
        tanggal_produksi: null,
        tanggal_kadaluarsa: null,
        prioritas: 'Medium',
        status: 'Terjadwal',
        komposisi_obat: '',
    });
    const [file, setFile] = useState(null);
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
                setFormData({
                    ...data,
                    tanggal_produksi: new Date(data.tanggal_produksi),
                    tanggal_kadaluarsa: new Date(data.tanggal_kadaluarsa)
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

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const data = new FormData();
        
        // Kirim tanggal dalam format YYYY-MM-DD
        data.append('tanggal_produksi', formData.tanggal_produksi.toISOString().split('T')[0]);
        data.append('tanggal_kadaluarsa', formData.tanggal_kadaluarsa.toISOString().split('T')[0]);
        
        // Hapus tanggal dari formData sebelum loop agar tidak terkirim dua kali
        const { tanggal_produksi, tanggal_kadaluarsa, id, created_at, updated_at, ...rest } = formData;
        for (const key in rest) {
            data.append(key, rest[key]);
        }
        if (file) {
            data.append('dokumen_bpom', file);
        } else {
            data.append('dokumen_bpom_existing', formData.dokumen_bpom || '');
        }

        try {
            const response = await fetch(`http://localhost:5000/api/produksi/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });
            if (!response.ok) throw new Error('Gagal mengupdate data');
            navigate('/produsen/manajemen-produksi');
        } catch (err) {
            setError(err.message);
        }
    };

    if (isLoading) return <div className="p-6 text-center">Loading...</div>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
                <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
                <main className="pt-16 p-6">
                    <h1 className="text-2xl font-bold mb-6">Edit Jadwal Produksi</h1>
                    {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
                        <div>
                            <label>Batch ID</label>
                            <input name="batch_id" value={formData.batch_id} onChange={handleInputChange} required className="w-full p-2 border rounded"/>
                        </div>
                        <div>
                            <label>Nama Obat</label>
                            <input name="nama_obat" value={formData.nama_obat} onChange={handleInputChange} required className="w-full p-2 border rounded"/>
                        </div>
                        <div>
                            <label>Jumlah</label>
                            <input type="number" name="jumlah" value={formData.jumlah} onChange={handleInputChange} required className="w-full p-2 border rounded"/>
                        </div>
                        <div>
                            <label>Tanggal Produksi</label>
                            <DatePicker selected={formData.tanggal_produksi} onChange={(date) => setFormData({...formData, tanggal_produksi: date})} dateFormat="dd/MM/yyyy" className="w-full p-2 border rounded"/>
                        </div>
                        <div>
                            <label>Tanggal Kadaluarsa</label>
                            <DatePicker selected={formData.tanggal_kadaluarsa} onChange={(date) => setFormData({...formData, tanggal_kadaluarsa: date})} dateFormat="dd/MM/yyyy" className="w-full p-2 border rounded"/>
                        </div>
                        <div>
                            <label>Prioritas</label>
                            <select name="prioritas" value={formData.prioritas} onChange={handleInputChange} className="w-full p-2 border rounded">
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div>
                            <label>Status</label>
                            <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border rounded">
                                <option value="Terjadwal">Terjadwal</option>
                                <option value="Dalam Produksi">Dalam Produksi</option>
                                <option value="Selesai">Selesai</option>
                            </select>
                        </div>
                        <div>
                            <label>Komposisi</label>
                            <textarea name="komposisi_obat" value={formData.komposisi_obat} onChange={handleInputChange} className="w-full p-2 border rounded"/>
                        </div>
                        <div>
                            <label>Dokumen BPOM (Upload baru untuk mengganti)</label>
                            <input type="file" name="dokumen_bpom" onChange={handleFileChange} className="w-full p-2 border rounded"/>
                            {formData.dokumen_bpom && !file && <p className="text-sm text-gray-500">File saat ini: {formData.dokumen_bpom}</p>}
                        </div>
                        <div className="flex justify-end space-x-4">
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
