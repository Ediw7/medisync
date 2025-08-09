import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Printer, ArrowLeft } from 'lucide-react';

const DetailPesanan = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesanan, setPesanan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');
  
        const response = await fetch(`http://localhost:5000/api/pbf/pesanan/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
  
        if (!response.ok) throw new Error('Gagal mengambil data pesanan');
  
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        setPesanan(result.data);
      } catch (error) {
        setError(error.message);
        if (error.message.includes('login')) navigate('/login/pbf');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  if (isLoading) return <div className="p-6 text-center">Memuat data pesanan...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  if (!pesanan) return <div className="p-6 text-center text-gray-500">Data pesanan tidak ditemukan.</div>;

  const { pesanan: info, detail_pesanan: detail } = pesanan;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        <main className="flex-1 pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => navigate('/pbf/pesan-obat')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft size={18} /> Kembali ke Daftar Pesanan
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-2 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700">
                <Printer size={18} /> Cetak Surat Pesanan
              </button>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-lg shadow-lg border border-gray-200">
              <header className="text-center mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">SURAT PESANAN</h1>
                <p className="text-gray-500">Nomor: {String(info.id).padStart(6, '0')}/SP/PBF/{new Date(info.tanggal_pesan).getMonth()+1}/{new Date(info.tanggal_pesan).getFullYear()}</p>
              </header>

              <section className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h2 className="font-semibold text-gray-600 mb-2">Pemesanan oleh:</h2>
                  <p className="font-bold">{info.nama_pbf}</p>
                  <p className="text-sm text-gray-600">{info.alamat_pbf}</p>
                  <p className="text-sm text-gray-600">Telp: {info.kontak_telepon}</p>
                  <p className="text-sm text-gray-600">Email: {info.kontak_email}</p>
                </div>
                <div className="text-right">
                  <h2 className="font-semibold text-gray-600 mb-2">Kepada Yth:</h2>
                  <p className="font-bold">{info.nama_produsen}</p>
                  <p className="text-sm text-gray-600">{info.alamat_produsen}</p>
                  <p className="text-sm text-gray-600">Tanggal Pesan: {formatDate(info.tanggal_pesan)}</p>
                </div>
              </section>

              <section>
                <p className="mb-4">Dengan hormat,<br/>Mohon untuk disediakan produk farmasi sebagai berikut:</p>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-sm font-semibold text-gray-700 border">No.</th>
                      <th className="p-3 text-sm font-semibold text-gray-700 border">Nama Obat</th>
                      <th className="p-3 text-sm font-semibold text-gray-700 border">Satuan</th>
                      <th className="p-3 text-sm font-semibold text-gray-700 border">Jumlah</th>
                      <th className="p-3 text-sm font-semibold text-gray-700 border">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail && detail.map((item, index) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3 border">{index + 1}</td>
                        <td className="p-3 border">{item.nama_obat}</td>
                        <td className="p-3 border">{item.satuan}</td>
                        <td className="p-3 border">{item.qty}</td>
                        <td className="p-3 border">{item.keterangan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-4">Produk tersebut akan kami gunakan untuk keperluan distribusi sesuai dengan peraturan yang berlaku.</p>
              </section>

              <footer className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t">
                <div>
                  <p>Hormat kami,</p>
                  <p>Apoteker Penanggung Jawab PBF,</p>
                  <div className="h-24 w-48 my-2 border rounded flex items-center justify-center">
                    {/* --- PERBAIKAN UTAMA DI SINI --- */}
                    {/* Hanya tampilkan gambar jika path-nya ada */}
                    {info.tanda_tangan_path && (
                      <img src={`http://localhost:5000/${info.tanda_tangan_path.replace(/\\/g, '/')}`} alt="Tanda Tangan" className="h-full w-full object-contain" />
                    )}
                  </div>
                  <p className="font-bold underline">{info.nama_apoteker_pbf}</p>
                  <p className="text-sm text-gray-600">SIPA: {info.nomor_sipa_pbf}</p>
                </div>
                <div className="text-center self-end">
                  <p>(Cap Perusahaan)</p>
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DetailPesanan;