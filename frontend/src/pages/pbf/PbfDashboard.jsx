import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPbf from '../../components/SidebarPbf';
import NavbarPbf from '../../components/NavbarPbf';
import { ShoppingCart, Truck, CheckCircle, Box, Eye } from 'lucide-react';

const PbfDashboard = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Data dummy untuk statistik dan tabel
  const [stats, setStats] = useState({
    totalDipesan: 250,
    pengirimanAktif: 12,
    stokTersedia: 120,
    pesananSelesai: 8,
  });

  const [stokTerbaru, setStokTerbaru] = useState([
    { id: 1, batchId: 'PCL-001', namaObat: 'Paracetamol 500mg', stok: 1200, kadaluarsa: '22-02-2028' },
    { id: 2, batchId: 'ACL-002', namaObat: 'Amoxicillin 500mg', stok: 1000, kadaluarsa: '22-02-2026' },
    { id: 3, batchId: 'OMP-003', namaObat: 'Omeprazole 500mg', stok: 0, kadaluarsa: '22-02-2026' },
  ]);

  const [pesananTerbaru, setPesananTerbaru] = useState([
    { id: 1, namaApotek: 'Apotek Maju', obat: 'Paracetamol', batchId: 'PCL-001', jumlah: 1200, status: 'Diproses' },
    { id: 2, namaApotek: 'Apotek Sentosa', obat: 'Amoxicillin', batchId: 'ACL-002', jumlah: 1000, status: 'Diterima' },
    { id: 3, namaApotek: 'Apotek Farma', obat: 'Omeprazole', batchId: 'OMP-003', jumlah: 1000, status: 'Dikirim' },
  ]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login/pbf');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const StatCard = ({ icon, value, label, unit }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-6">
      <div className="bg-emerald-100 p-4 rounded-full">{icon}</div>
      <div>
        <p className="text-3xl font-bold text-gray-800">{value} <span className="text-xl font-medium text-gray-500">{unit}</span></p>
        <p className="text-gray-500">{label}</p>
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Diproses': return 'bg-yellow-100 text-yellow-800';
      case 'Diterima': return 'bg-green-100 text-green-800';
      case 'Dikirim': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

          {/* Kartu Statistik */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<ShoppingCart size={32} className="text-emerald-600"/>} value={stats.totalDipesan} label="Total obat dipesan" unit="box" />
            <StatCard icon={<Truck size={32} className="text-emerald-600"/>} value={stats.pengirimanAktif} label="Pengiriman Aktif" unit="unit" />
            <StatCard icon={<CheckCircle size={32} className="text-emerald-600"/>} value={stats.stokTersedia} label="Stok Tersedia" unit="box" />
            <StatCard icon={<Box size={32} className="text-emerald-600"/>} value={stats.pesananSelesai} label="Pesanan belum selesai" unit="box" />
          </div>

          {/* Tabel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabel Stok Obat Terbaru */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Stok obat terbaru</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Obat</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kadaluwarsa</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stokTerbaru.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.batchId}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.namaObat}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.stok} box</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-600 font-medium">{item.kadaluarsa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabel Pesanan Terbaru */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Pesanan terbaru</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Apotek</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Obat</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pesananTerbaru.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.namaApotek}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.obat}<br/><span className="text-xs text-gray-400">Batch ID: {item.batchId}</span></td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.jumlah} box</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PbfDashboard;
