import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Building } from 'lucide-react';

const PilihProdusen = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [produsenList, setProdusenList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProdusen = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) navigate('/login/pbf');
        const response = await fetch('http://localhost:5000/api/pbf/produsen', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          setProdusenList(result.data);
        } else {
          throw new Error(result.message || 'Gagal memuat daftar produsen.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProdusen();
  }, [navigate]);

  const handleProdusenSelect = (produsenId) => {
    navigate(`/pbf/pesan-obat/tambah/${produsenId}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="pt-16 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Pesan Obat ke Produsen</h1>
            <p className="text-gray-500">Langkah 1: Pilih produsen yang dituju.</p>
          </div>
          {error && <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>}
          {isLoading ? (
            <p>Memuat daftar produsen...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {produsenList.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => handleProdusenSelect(p.id)} 
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border-l-4 border-transparent hover:border-emerald-500"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <Building className="text-emerald-600" size={24} />
                    <h2 className="font-bold text-lg text-gray-800">{p.nama_resmi}</h2>
                  </div>
                  <p className="text-sm text-gray-500">{p.alamat}</p>
                  <p className="text-sm text-gray-500 mt-1">{p.email}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PilihProdusen;