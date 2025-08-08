import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../components/SidebarProdusen';
import NavbarProdusen from '../../components/NavbarProdusen';

function ProdusenDashboard() {
    const [username, setUsername] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [dashboardData, setDashboardData] = useState({
      totalProduksi: 1284,
      pengirimanAktif: 67,
      jualTersedia: 1284,
      efisiensiProduksi: 87.5,
      aktivitasTerbaru: [
        { id: 1, jenis: 'Pengiriman 123 Selesai', waktu: '2 jam yang lalu' },
        { id: 2, jenis: 'Pengiriman 123 Selesai', waktu: '3 jam yang lalu' },
        { id: 3, jenis: 'Pengiriman 123 Selesai', waktu: '3 jam yang lalu' },
        { id: 4, jenis: 'Pengiriman 123 Selesai', waktu: '4 jam yang lalu' },
      ],
    });
  
    const navigate = useNavigate();
  
    useEffect(() => {
      const storedUsername = localStorage.getItem('username');
      const token = localStorage.getItem('token');
      // Jika tidak ada token, redirect ke halaman login
      if (!token) {
        navigate('/roles');
        return;
      }
      if (storedUsername) setUsername(storedUsername);
    }, [navigate]);
  
    const handleLogout = () => {
        // Di dunia nyata, Anda mungkin ingin memanggil endpoint logout di backend
        // untuk memasukkan token ke dalam blacklist.
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/');
    };
  
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            isCollapsed ? 'ml-16' : 'w-64'
          }`}
        >
          <NavbarProdusen username={username} onLogout={handleLogout} />
          <main className="pt-16 p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Dashboard {username || 'Produsen'}</h1>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Card Total Produksi */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                    </svg>
                  </div>
                  <span className="text-green-500 font-medium">+12.5%</span>
                </div>
                <h2 className="text-3xl font-bold">{dashboardData.totalProduksi}</h2>
                <p className="text-gray-500">Total produksi</p>
              </div>
  
              {/* Card Pengiriman Aktif */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <span className="text-blue-500 font-medium">+5</span>
                </div>
                <h2 className="text-3xl font-bold">{dashboardData.pengirimanAktif}</h2>
                <p className="text-gray-500">Pengiriman Aktif</p>
              </div>
  
              {/* Card Jumlah Tersedia */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-gray-500 font-medium">Stabil</span>
                </div>
                <h2 className="text-3xl font-bold">{dashboardData.jualTersedia}</h2>
                <p className="text-gray-500">Jumlah Tersedia</p>
              </div>
  
              {/* Card Efisiensi Produksi */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-green-500 font-medium">+1.5%</span>
                </div>
                <h2 className="text-3xl font-bold">{dashboardData.efisiensiProduksi}%</h2>
                <p className="text-gray-500">Efisiensi Produksi</p>
              </div>
            </div>
  
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Aktivitas Terbaru</h2>
              <div className="space-y-4">
                {dashboardData.aktivitasTerbaru.map((aktivitas) => (
                  <div key={aktivitas.id} className="flex items-center py-3 border-b last:border-0">
                    <div className="p-2 bg-green-100 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">{aktivitas.jenis}</p>
                      <p className="text-sm text-gray-500">{aktivitas.waktu}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  export default ProdusenDashboard;
