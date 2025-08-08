import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PilihRole from './pages/PilihRole';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import ProdusenDashboard from './pages/produsen/ProdusenDashboard';
import ManajemenProduksi from './pages/produsen/manajemenproduksi/ManajemenProduksi';
import TambahProduksi from './pages/produsen/manajemenproduksi/TambahProduksi';
import EditProduksi from './pages/produsen/manajemenproduksi/EditProduksi';
import DetailProduksi from './pages/produsen/manajemenproduksi/DetailProduksi';
import RiwayatProduksi from './pages/produsen/manajemenproduksi/RiwayatProduksi';

import MonitoringStok from './pages/produsen/monitoringstok/MonitoringStok';
import RiwayatDistribusi from './pages/produsen/monitoringstok/RiwayatDistribusi';

import PbfDashboard from './pages/pbf/PbfDashboard';
import PesanObat from './pages/pbf/pesanobat/PesanObat';
import PilihProdusen from './pages/pbf/pesanobat/PilihProdusen';
import TambahPesanan from './pages/pbf/pesanobat/TambahPesanan';


import ApotekDashboard from './pages/apotek/ApotekDashboard';




function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/roles" element={<PilihRole />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/register/:role" element={<RegisterPage />} />
      
       {/* Rute Produsen */}
      <Route path="/produsen/dashboard" element={<ProdusenDashboard />} />
      <Route path="/produsen/manajemen-produksi" element={<ManajemenProduksi />} />
      <Route path="/produsen/produksi/tambah" element={<TambahProduksi />} />
      <Route path="/produsen/produksi/edit/:id" element={<EditProduksi />} />
      <Route path="/produsen/produksi/detail/:id" element={<DetailProduksi />} />
      <Route path="/produsen/riwayat-produksi" element={<RiwayatProduksi />} />

      <Route path="/produsen/monitoring-stok" element={<MonitoringStok />} />
      <Route path="/produsen/riwayat-distribusi" element={<RiwayatDistribusi />} /> 
      
      <Route path="/pbf/dashboard" element={<PbfDashboard />} />
      <Route path="/pbf/pesan-obat" element={<PesanObat />} />
      <Route path="/pbf/pesan-obat/tambah" element={<PilihProdusen />} /> {/* <-- Rute Baru */}
      <Route path="/pbf/pesan-obat/tambah/:idProdusen" element={<TambahPesanan />} /> {/* <-- Rute Diperbarui */}
      


      <Route path="/apotek/dashboard" element={<ApotekDashboard />} />
    </Routes>
  );
}

export default App;