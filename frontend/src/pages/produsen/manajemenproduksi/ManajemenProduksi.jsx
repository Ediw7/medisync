import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';

const ManajemenProduksi = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [produksiData, setProduksiData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');
  
        const response = await fetch('http://localhost:5000/api/produksi/jadwal', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        if (!response.ok) throw new Error('Gagal mengambil data');
  
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        setProduksiData(result.data || []);
      } catch (error) {
        setError(error.message);
        if (error.message.includes('login')) navigate('/login/produsen');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/produksi/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Gagal menghapus data');
      setProduksiData(produksiData.filter(item => item.id !== id));
      alert('Data berhasil dihapus');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Manajemen Produksi</h1>
            <button onClick={() => navigate('/produsen/produksi/tambah')} className="bg-[#18A375] hover:bg-[#158c63] text-white py-2 px-4 rounded">
              + Jadwalkan Produksi
            </button>
          </div>
          {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            {isLoading ? <p>Loading...</p> : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Obat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {produksiData.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.batch_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nama_obat}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jumlah}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                        <button onClick={() => navigate(`/produsen/produksi/detail/${item.id}`)} className="text-indigo-600 hover:text-indigo-900">Detail</button>
                        <button onClick={() => navigate(`/produsen/produksi/edit/${item.id}`)} className="text-yellow-600 hover:text-yellow-900">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManajemenProduksi;