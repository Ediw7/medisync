import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Search, Calendar, ChevronDown } from 'lucide-react';

const PesanObat = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananData, setPesananData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');
  
        const response = await fetch('http://localhost:5000/api/pesanan-pbf', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        if (!response.ok) throw new Error('Gagal mengambil data pesanan');
  
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        setPesananData(result.data || []);
      } catch (error) {
        setError(error.message);
        if (error.message.includes('login')) navigate('/login/pbf');
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
    return pesananData
      .filter(item => {
        if (statusFilter === 'Semua Status') return true;
        return item.status_pesanan === statusFilter;
      })
      .filter(item =>
        item.id.toString().includes(searchTerm) ||
        item.nama_produsen.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [pesananData, searchTerm, statusFilter]);
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Menunggu': return 'bg-yellow-100 text-yellow-800';
      case 'Diterima': return 'bg-green-100 text-green-800';
      case 'Dikirim': return 'bg-blue-100 text-blue-800';
      case 'Diproses': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold">Pesanan Obat ke Produsen</h1>
                <p className="text-gray-500">Pilih obat yang akan dipesan</p>
            </div>
            <button onClick={() => navigate('/pbf/pesan-obat/tambah')} className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded flex items-center gap-2">
              <span className="font-semibold">+</span> Pesan Obat
            </button>
          </div>

          {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold mb-4">Lihat Pesanan obat Anda</h2>
                <div className="flex items-center gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg" placeholder="Cari ID Pesanan atau nama Produsen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 border rounded-lg">
                        <option>Semua Status</option>
                        <option>Menunggu</option>
                        <option>Diproses</option>
                        <option>Dikirim</option>
                    </select>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg" placeholder="Waktu Pesan"/>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? <p className="p-4 text-center">Loading...</p> : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alamat Pengiriman</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.nama_produsen}
                            <div className="text-xs text-gray-400">ID Pesanan : {String(item.id).padStart(6, '0')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Link to={`/pbf/pesanan/${item.id}/surat`} className="text-blue-600 hover:underline">Lihat Surat Pesanan</Link>
                            <div className="text-xs text-gray-400">Rp. {item.total_harga.toLocaleString('id-ID')}</div>
                            <div className="text-xs text-gray-400">Via: {item.metode_pembayaran}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.alamat_pengiriman}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.tanggal_pesan).toLocaleDateString('id-ID')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status_pesanan)}`}>
                            {item.status_pesanan}
                           </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:underline">
                          <Link to={`/pbf/pesanan/${item.id}/lacak`}>Lacak pengiriman</Link>
                        </td>
                      </tr>
                    )) : (
                        <tr>
                            <td colSpan="6" className="text-center py-10 text-gray-500">
                                {searchTerm || statusFilter !== 'Semua Status' ? "Tidak ada pesanan yang sesuai dengan filter." : "Anda belum memiliki pesanan."}
                            </td>
                        </tr>
                    )}
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
export default PesanObat;