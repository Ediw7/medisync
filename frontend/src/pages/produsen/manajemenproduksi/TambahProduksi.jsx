import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';

const TambahProduksi = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    batch_id: '', nama_obat: '', jumlah: '', tanggal_produksi: '', tanggal_kadaluarsa: '',
    prioritas: 'Medium', status: 'Terjadwal', komposisi_obat: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  // --- PERBAIKAN: Tambahkan useEffect untuk memeriksa token saat halaman dimuat ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Anda harus login untuk mengakses halaman ini.');
      navigate('/login/produsen');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    // Tambahkan pengecekan token lagi sebelum mengirim
    if (!token) {
        setError('Sesi Anda telah berakhir, silakan login kembali.');
        return;
    }
    
    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }
    if (file) {
      data.append('dokumen_bpom', file);
    }

    try {
      const response = await fetch('http://localhost:5000/api/produksi', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Gagal menambahkan data');
      }
      navigate('/produsen/manajemen-produksi');
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="pt-16 p-6">
          <h1 className="text-2xl font-bold mb-6">Jadwalkan Produksi Baru</h1>
          {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
            {/* Input fields */}
            <input name="batch_id" value={formData.batch_id} onChange={handleInputChange} placeholder="Batch ID" required className="w-full p-2 border rounded"/>
            <input name="nama_obat" value={formData.nama_obat} onChange={handleInputChange} placeholder="Nama Obat" required className="w-full p-2 border rounded"/>
            <input type="number" name="jumlah" value={formData.jumlah} onChange={handleInputChange} placeholder="Jumlah" required className="w-full p-2 border rounded"/>
            <div><label>Tanggal Produksi:</label><input type="date" name="tanggal_produksi" value={formData.tanggal_produksi} onChange={handleInputChange} required className="w-full p-2 border rounded"/></div>
            <div><label>Tanggal Kadaluarsa:</label><input type="date" name="tanggal_kadaluarsa" value={formData.tanggal_kadaluarsa} onChange={handleInputChange} required className="w-full p-2 border rounded"/></div>
            <select name="prioritas" value={formData.prioritas} onChange={handleInputChange} className="w-full p-2 border rounded">
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <textarea name="komposisi_obat" value={formData.komposisi_obat} onChange={handleInputChange} placeholder="Komposisi Obat" className="w-full p-2 border rounded"/>
            <div><label>Dokumen BPOM:</label><input type="file" name="dokumen_bpom" onChange={handleFileChange} className="w-full p-2 border rounded"/></div>
            <div className="flex justify-end space-x-4">
              <button type="button" onClick={() => navigate('/produsen/manajemen-produksi')} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100">Batal</button>
              <button type="submit" className="px-4 py-2 bg-[#18A375] text-white rounded hover:bg-[#158c63]">Simpan</button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default TambahProduksi;
