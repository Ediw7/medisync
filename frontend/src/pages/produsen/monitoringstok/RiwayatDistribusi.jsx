import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Search } from 'lucide-react';

const RiwayatDistribusi = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [distribusiData, setDistribusiData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');
  
        // Ganti endpoint ini dengan endpoint API Anda untuk mengambil data riwayat distribusi
        const response = await fetch('http://localhost:5000/api/produksi/jadwal', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        if (!response.ok) throw new Error('Gagal mengambil data');
  
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        
        // Untuk demonstrasi, kita filter data yang sudah "Tercatat di Blockchain"
        const riwayat = result.data.filter(item => item.status === 'Tercatat di Blockchain');
        setDistribusiData(riwayat || []);
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

  const filteredData = useMemo(() => {
    return distribusiData
      .filter(item => {
        if (statusFilter === 'Semua') return true;
        // Ganti 'status_pengiriman' dengan field yang sesuai dari API Anda
        return item.status_pengiriman === statusFilter;
      })
      .filter(item =>
        item.batch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_obat.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [distribusiData, searchTerm, statusFilter]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <h1 className="text-2xl font-bold mb-6">Monitoring Stok</h1>

          {/* Kartu Statistik bisa ditampilkan di sini juga jika perlu */}

          {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              {/* Tabs */}
              <div className="flex">
                <Link to="/produsen/monitoring-stok" className="py-2 px-4 text-center text-gray-500 hover:text-emerald-600">Stok Gudang</Link>
                <button className="py-2 px-4 text-center border-b-2 border-emerald-600 text-emerald-600 font-medium">Riwayat Distribusi</button>
              </div>
              {/* Search & Filter */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 border rounded-lg">
                    <option>Semua status</option>
                    <option>Dikirim</option>
                    <option>Diterima</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? <p className="p-4 text-center">Loading...</p> : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tujuan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimasi Tiba</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pengiriman</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.batch_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.tanggal_produksi).toLocaleDateString('id-ID')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">PBF Sejahtera</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jumlah.toLocaleString('id-ID')} box</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.tanggal_produksi).toLocaleDateString('id-ID')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">John Doe</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Dikirim
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default RiwayatDistribusi;