import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Plus, Trash2, Loader2, Upload, FileText } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

const TambahPesanan = () => {
  const navigate = useNavigate();
  const { idProdusen } = useParams();
  const sigCanvas = useRef({});

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stokObat, setStokObat] = useState([]);
  const [infoPemesanan, setInfoPemesanan] = useState({
    nomorPo: `PO-${Date.now()}`,
    namaApotekerPbf: '',
    jabatanApotekerPbf: '',
    nomorSipaPbf: '',
    alamatProdusen: '',
    teleponProdusen: '',
    alamatPengiriman: localStorage.getItem('namaResmi') || '',
    metodePembayaran: 'Transfer Bank',
    totalHarga: 0,
  });
  const [dokumen, setDokumen] = useState({
    sikaSipa: null,
    izinPbf: null,
    npwp: null,
    aktePerusahaan: null,
    nib: null,
  });
  const [itemObat, setItemObat] = useState({
    idProduksi: '',
    namaObat: '',
    qty: '',
    hargaSatuan: '',
    satuan: 'Box',
    nomorNie: '',
    coa: null,
    coaPath: '',
    keterangan: '',
  });
  const [detailObat, setDetailObat] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch stok obat
  useEffect(() => {
    const fetchStok = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login/pbf');
          return;
        }
        const response = await fetch(`http://localhost:5000/api/pbf/produsen/${idProdusen}/stok`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setStokObat(result.data);
        } else {
          throw new Error(result.message || 'Gagal memuat stok obat.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (idProdusen) {
      fetchStok();
    }
  }, [idProdusen, navigate]);

  // Handler untuk info pemesanan
  const handleInfoChange = (e) => {
    setInfoPemesanan({ ...infoPemesanan, [e.target.name]: e.target.value });
  };

  // Handler untuk upload dokumen
  const handleDokumenChange = (e) => {
    const { name, files } = e.target;
    if (files[0]) {
      setDokumen({ ...dokumen, [name]: files[0] });
    }
  };

  // Handler untuk item obat
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemObat({ ...itemObat, [name]: value });
  };

  // Handler untuk upload COA
  const handleCoaChange = (e) => {
    if (e.target.files[0]) {
      setItemObat({ ...itemObat, coa: e.target.files[0], coaPath: '' });
    }
  };

  // Handler untuk memilih obat
  const handleItemSelect = (e) => {
    const selectedId = e.target.value;
    const selected = stokObat.find((o) => o.id.toString() === selectedId);
    if (selected) {
      setItemObat({
        idProduksi: selected.id,
        namaObat: selected.nama_obat,
        hargaSatuan: selected.harga_satuan || 0,
        satuan: selected.satuan || 'Box',
        qty: '1',
        nomorNie: selected.nomor_izin_edar || '',
        coa: null,
        coaPath: selected.sertifikat_analisis_path || '',
        keterangan: '',
      });
    } else {
      setItemObat({
        idProduksi: '',
        namaObat: '',
        hargaSatuan: '',
        satuan: 'Box',
        qty: '',
        nomorNie: '',
        coa: null,
        coaPath: '',
        keterangan: '',
      });
    }
  };

  // Handler untuk tambah item
  const handleAddItem = () => {
    if (!itemObat.idProduksi || !itemObat.qty || Number(itemObat.qty) <= 0 || !itemObat.nomorNie) {
      setError('Pilih obat, masukkan jumlah yang valid, dan isi Nomor Izin Edar.');
      return;
    }
    const selectedObat = stokObat.find((o) => o.id.toString() === itemObat.idProduksi.toString());
    if (Number(itemObat.qty) > selectedObat.jumlah) {
      setError(`Jumlah pesanan (${itemObat.qty}) melebihi stok tersedia (${selectedObat.jumlah}).`);
      return;
    }
    setDetailObat([...detailObat, { ...itemObat, qty: Number(itemObat.qty), hargaSatuan: Number(itemObat.hargaSatuan) }]);
    setItemObat({
      idProduksi: '',
      namaObat: '',
      qty: '',
      hargaSatuan: '',
      satuan: 'Box',
      nomorNie: '',
      coa: null,
      coaPath: '',
      keterangan: '',
    });
    setError('');
  };

  // Handler untuk hapus item
  const handleRemoveItem = (index) => {
    setDetailObat(detailObat.filter((_, i) => i !== index));
  };

  // Hitung total harga
  useEffect(() => {
    const total = detailObat.reduce((sum, item) => sum + Number(item.qty) * Number(item.hargaSatuan), 0);
    setInfoPemesanan((prev) => ({ ...prev, totalHarga: total }));
  }, [detailObat]);

  // Handler untuk hapus tanda tangan
  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  // Handler untuk submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validasi info pemesanan
    if (
      !infoPemesanan.nomorPo ||
      !infoPemesanan.namaApotekerPbf ||
      !infoPemesanan.jabatanApotekerPbf ||
      !infoPemesanan.nomorSipaPbf ||
      !infoPemesanan.alamatProdusen ||
      !infoPemesanan.teleponProdusen ||
      !infoPemesanan.alamatPengiriman ||
      !infoPemesanan.metodePembayaran
    ) {
      setError('Semua informasi pemesanan harus diisi.');
      setIsSubmitting(false);
      return;
    }

    // Validasi dokumen
    if (!dokumen.sikaSipa || !dokumen.izinPbf || !dokumen.npwp || !dokumen.aktePerusahaan || !dokumen.nib) {
      setError('Semua dokumen legal wajib diunggah.');
      setIsSubmitting(false);
      return;
    }

    // Validasi detail obat
    if (detailObat.length === 0) {
      setError('Tambahkan setidaknya satu item obat.');
      setIsSubmitting(false);
      return;
    }

    // Validasi tanda tangan
    if (sigCanvas.current.isEmpty()) {
      setError('Tanda tangan Apoteker Penanggung Jawab wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Tambahkan info pemesanan
      formData.append('infoPemesanan', JSON.stringify({
        idProdusen: Number(idProdusen),
        nomorPo: infoPemesanan.nomorPo,
        namaApotekerPbf: infoPemesanan.namaApotekerPbf,
        jabatanApotekerPbf: infoPemesanan.jabatanApotekerPbf,
        nomorSipaPbf: infoPemesanan.nomorSipaPbf,
        alamatProdusen: infoPemesanan.alamatProdusen,
        teleponProdusen: infoPemesanan.teleponProdusen,
        alamatPengiriman: infoPemesanan.alamatPengiriman,
        metodePembayaran: infoPemesanan.metodePembayaran,
        totalHarga: infoPemesanan.totalHarga,
      }));

      // Tambahkan detail obat
      formData.append('detailObat', JSON.stringify(
        detailObat.map((item) => ({
          idProduksi: Number(item.idProduksi),
          namaObat: item.namaObat,
          qty: Number(item.qty),
          hargaSatuan: Number(item.hargaSatuan),
          satuan: item.satuan,
          nomorNie: item.nomorNie,
          coaPath: item.coaPath,
          keterangan: item.keterangan,
        }))
      ));

      // Tambahkan dokumen
      formData.append('sikaSipa', dokumen.sikaSipa);
      formData.append('izinPbf', dokumen.izinPbf);
      formData.append('npwp', dokumen.npwp);
      formData.append('aktePerusahaan', dokumen.aktePerusahaan);
      formData.append('nib', dokumen.nib);
      detailObat.forEach((item, index) => {
        if (item.coa) {
          formData.append(`coa_${index}`, item.coa);
        }
      });

      // Tambahkan tanda tangan
      const tandaTanganDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      const tandaTanganBlob = await fetch(tandaTanganDataUrl).then((res) => res.blob());
      formData.append('tandaTangan', tandaTanganBlob, 'tanda_tangan.png');

      const response = await fetch('http://localhost:5000/api/pesanan-pbf', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal membuat pesanan');

      alert('Pesanan berhasil dibuat!');
      navigate('/pbf/pesan-obat');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Buat Pesanan Obat</h1>
                <p className="text-gray-500 mt-1">Isi detail pesanan dan unggah dokumen sesuai regulasi BPOM/Kemenkes.</p>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/pbf/pesan-obat/tambah')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:bg-gray-400 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pesanan'}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            {/* Informasi Pemesanan */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-emerald-700 mb-4">Informasi Pemesanan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nomor Purchase Order (PO)</label>
                  <input
                    name="nomorPo"
                    value={infoPemesanan.nomorPo}
                    onChange={handleInfoChange}
                    placeholder="Masukkan nomor PO"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Apoteker</label>
                  <input
                    name="namaApotekerPbf"
                    value={infoPemesanan.namaApotekerPbf}
                    onChange={handleInfoChange}
                    placeholder="Masukkan nama apoteker"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Jabatan</label>
                  <input
                    name="jabatanApotekerPbf"
                    value={infoPemesanan.jabatanApotekerPbf}
                    onChange={handleInfoChange}
                    placeholder="Masukkan jabatan"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nomor SIPA</label>
                  <input
                    name="nomorSipaPbf"
                    value={infoPemesanan.nomorSipaPbf}
                    onChange={handleInfoChange}
                    placeholder="Masukkan nomor SIPA"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alamat Produsen</label>
                  <input
                    name="alamatProdusen"
                    value={infoPemesanan.alamatProdusen}
                    onChange={handleInfoChange}
                    placeholder="Masukkan alamat produsen"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telepon Produsen</label>
                  <input
                    name="teleponProdusen"
                    value={infoPemesanan.teleponProdusen}
                    onChange={handleInfoChange}
                    placeholder="Masukkan nomor telepon"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Metode Pembayaran</label>
                  <select
                    name="metodePembayaran"
                    value={infoPemesanan.metodePembayaran}
                    onChange={handleInfoChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Kredit">Kredit</option>
                    <option value="Tunai">Tunai</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Alamat Pengiriman</label>
                  <input
                    name="alamatPengiriman"
                    value={infoPemesanan.alamatPengiriman}
                    onChange={handleInfoChange}
                    placeholder="Masukkan alamat pengiriman"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Dokumen Legal */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-emerald-700 mb-4">Dokumen Legal</h2>
              <p className="text-sm text-gray-500 mb-4">Unggah dokumen sesuai regulasi BPOM dan Kemenkes.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'sikaSipa', label: 'SIKA/SIPA' },
                  { name: 'izinPbf', label: 'Izin PBF' },
                  { name: 'npwp', label: 'NPWP' },
                  { name: 'aktePerusahaan', label: 'Akte Perusahaan' },
                  { name: 'nib', label: 'NIB' },
                ].map((doc) => (
                  <div key={doc.name}>
                    <label className="block text-sm font-medium text-gray-700">{doc.label}</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="file"
                        name={doc.name}
                        onChange={handleDokumenChange}
                        accept=".pdf,.png,.jpg"
                        className="hidden"
                        id={doc.name}
                      />
                      <label
                        htmlFor={doc.name}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition flex items-center gap-2"
                      >
                        <Upload size={18} />
                        {dokumen[doc.name] ? dokumen[doc.name].name : 'Pilih File'}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail Pemesanan Obat */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-emerald-700 mb-4">Detail Pemesanan Obat</h2>
              {detailObat.length > 0 && (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 text-sm font-semibold text-gray-700">Nama Obat</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Nomor NIE</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Jumlah</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Harga Satuan</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Total</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">COA</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailObat.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3 text-gray-800">{item.namaObat}</td>
                          <td className="p-3 text-gray-800">{item.nomorNie}</td>
                          <td className="p-3 text-gray-800">
                            {item.qty} {item.satuan}
                          </td>
                          <td className="p-3 text-gray-800">Rp {Number(item.hargaSatuan).toLocaleString('id-ID')}</td>
                          <td className="p-3 text-gray-800 font-semibold">
                            Rp {(item.qty * item.hargaSatuan).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-gray-800">
                            {item.coa ? item.coa.name : item.coaPath ? (
                              <a
                                href={`http://localhost:5000/${item.coaPath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline flex items-center gap-1"
                              >
                                <FileText size={16} /> Lihat COA
                              </a>
                            ) : '-'}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-500 hover:text-red-700 transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan="4" className="p-3 text-right">Total Harga:</td>
                        <td className="p-3">Rp {infoPemesanan.totalHarga.toLocaleString('id-ID')}</td>
                        <td colSpan="2" className="p-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pt-4 border-t">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Pilih Obat</label>
                  <select
                    onChange={handleItemSelect}
                    value={itemObat.idProduksi}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">-- Pilih Obat --</option>
                    {isLoading ? (
                      <option>Loading...</option>
                    ) : (
                      stokObat.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.nama_obat} (Stok: {o.jumlah} {o.satuan || 'Box'})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Nomor Izin Edar (NIE)</label>
                  <input
                    name="nomorNie"
                    value={itemObat.nomorNie}
                    onChange={handleItemChange}
                    placeholder="Masukkan NIE"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Jumlah</label>
                  <input
                    name="qty"
                    type="number"
                    min="1"
                    value={itemObat.qty}
                    onChange={handleItemChange}
                    placeholder="Qty"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Harga Satuan</label>
                  <input
                    name="hargaSatuan"
                    type="number"
                    value={itemObat.hargaSatuan}
                    onChange={handleItemChange}
                    placeholder="Masukkan harga satuan"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Satuan</label>
                  <select
                    name="satuan"
                    value={itemObat.satuan}
                    onChange={handleItemChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="Box">Box</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Kapsul">Kapsul</option>
                    <option value="Botol">Botol</option>
                    <option value="Ampul">Ampul</option>
                    <option value="Vial">Vial</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Certificate of Analysis (COA, Opsional)</label>
                  <div className="mt-1 flex items-center gap-2">
                    {itemObat.coaPath ? (
                      <a
                        href={`http://localhost:5000/${itemObat.coaPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <FileText size={16} /> Lihat COA
                      </a>
                    ) : (
                      <>
                        <input
                          type="file"
                          name="coa"
                          onChange={handleCoaChange}
                          accept=".pdf,.png,.jpg"
                          className="hidden"
                          id="coa"
                        />
                        <label
                          htmlFor="coa"
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition flex items-center gap-2"
                        >
                          <Upload size={18} />
                          {itemObat.coa ? itemObat.coa.name : 'Pilih File'}
                        </label>
                      </>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Tambah
                  </button>
                </div>
              </div>
            </div>

            {/* Tanda Tangan Apoteker */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-emerald-700 mb-4">Tanda Tangan Apoteker</h2>
              <p className="text-sm text-gray-500 mb-2">Silakan tanda tangan untuk konfirmasi pesanan:</p>
              <div className="w-full h-48 bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{ className: 'w-full h-full' }}
                />
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                >
                  Hapus Tanda Tangan
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default TambahPesanan;