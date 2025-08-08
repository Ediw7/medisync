import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TambahProduksi = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    batch_id: '',
    nama_obat: '',
    nomor_izin_edar: '',
    dosis: '',
    jumlah: '',
    tanggal_produksi: null,
    tanggal_kadaluarsa: null,
    prioritas: 'Medium',
    status: 'Terjadwal',
    komposisi_obat: '',
  });
  const [dokumenBpomFile, setDokumenBpomFile] = useState(null);
  const [sertifikatFile, setSertifikatFile] = useState(null);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
        setError('Sesi Anda telah berakhir, silakan login kembali.');
        return;
    }
    
    const data = new FormData();
    // Append all text fields
    Object.keys(formData).forEach(key => {
        if (key === 'tanggal_produksi' || key === 'tanggal_kadaluarsa') {
            if (formData[key]) {
                data.append(key, formData[key].toISOString().split('T')[0]);
            }
        } else {
            data.append(key, formData[key]);
        }
    });

    // Append files with the correct field names
    if (dokumenBpomFile) {
      data.append('dokumen_bpom', dokumenBpomFile);
    }
    if (sertifikatFile) {
      data.append('sertifikat_analisis', sertifikatFile);
    }

    try {
      const response = await fetch('http://localhost:5000/api/produksi', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal menambahkan data');
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
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="batch_id" value={formData.batch_id} onChange={handleInputChange} placeholder="Batch ID Unik" required className="w-full p-2 border rounded"/>
              <input name="nama_obat" value={formData.nama_obat} onChange={handleInputChange} placeholder="Nama Obat" required className="w-full p-2 border rounded"/>
              <input name="nomor_izin_edar" value={formData.nomor_izin_edar} onChange={handleInputChange} placeholder="Nomor Izin Edar (NIE)" className="w-full p-2 border rounded"/>
              <input name="dosis" value={formData.dosis} onChange={handleInputChange} placeholder="Dosis (cth: 500mg)" className="w-full p-2 border rounded"/>
              <input type="number" name="jumlah" value={formData.jumlah} onChange={handleInputChange} placeholder="Jumlah Produksi (pcs)" required className="w-full p-2 border rounded"/>
              <select name="prioritas" value={formData.prioritas} onChange={handleInputChange} className="w-full p-2 border rounded">
                <option value="High">Prioritas Tinggi</option>
                <option value="Medium">Prioritas Sedang</option>
                <option value="Low">Prioritas Rendah</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label>Tanggal Produksi:</label>
                  <DatePicker selected={formData.tanggal_produksi} onChange={(date) => setFormData({...formData, tanggal_produksi: date})} dateFormat="dd/MM/yyyy" className="w-full p-2 border rounded" required />
                </div>
                <div><label>Tanggal Kadaluarsa:</label>
                  <DatePicker selected={formData.tanggal_kadaluarsa} onChange={(date) => setFormData({...formData, tanggal_kadaluarsa: date})} dateFormat="dd/MM/yyyy" className="w-full p-2 border rounded" required />
                </div>
            </div>
            <textarea name="komposisi_obat" value={formData.komposisi_obat} onChange={handleInputChange} placeholder="Komposisi Obat" className="w-full p-2 border rounded"/>
            <div>
                <label>Sertifikat Analisis (Opsional):</label>
                <input type="file" name="sertifikat_analisis" onChange={(e) => setSertifikatFile(e.target.files[0])} className="w-full p-2 border rounded"/>
            </div>
            <div>
                <label>Dokumen BPOM (Opsional):</label>
                <input type="file" name="dokumen_bpom" onChange={(e) => setDokumenBpomFile(e.target.files[0])} className="w-full p-2 border rounded"/>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={() => navigate('/produsen/manajemen-produksi')} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100">Batal</button>
              <button type="submit" className="px-4 py-2 bg-[#18A375] text-white rounded hover:bg-[#158c63]">Simpan Jadwal</button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};
export default TambahProduksi;