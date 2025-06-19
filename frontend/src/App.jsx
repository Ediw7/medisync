import { useState } from 'react';
import axios from 'axios';

// Ganti App.css dengan import file tailwind
// import './index.css'; 

const API_URL = 'http://localhost:3001/api';

function App() {
  // State untuk form pembuatan obat
  const [createForm, setCreateForm] = useState({ id: '', nama: '', batch: '', tanggalKadaluarsa: '' });
  
  // State untuk form query obat
  const [queryId, setQueryId] = useState('');
  
  // State untuk menampilkan hasil dan pesan
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');

  const handleCreateChange = (e) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setMessage('Submitting transaction...');
    setResult(null);
    try {
      const response = await axios.post(`${API_URL}/obat`, createForm);
      setMessage(response.data.message);
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    setMessage('Querying ledger...');
    setResult(null);
    try {
      const response = await axios.get(`${API_URL}/obat/${queryId}`);
      setResult(response.data);
      setMessage('Query successful!');
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col items-center p-4">
      <div className="w-full max-w-5xl">
        <header className="mb-10 text-center">
            <h1 className="text-5xl font-bold text-blue-800">MediSync DApp</h1>
            <p className="text-gray-600 mt-2">Melacak Distribusi Obat dengan Hyperledger Fabric</p>
        </header>

        <main className="w-full grid md:grid-cols-2 gap-8">
            {/* Kolom Kiri: Buat & Cari */}
            <div className="flex flex-col gap-8">
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">Buat Obat Baru (Produsen)</h2>
                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        <input
                            name="id"
                            placeholder="ID Obat (e.g., OBAT002)"
                            onChange={handleCreateChange}
                            value={createForm.id}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            name="nama"
                            placeholder="Nama Obat"
                            onChange={handleCreateChange}
                            value={createForm.nama}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            name="batch"
                            placeholder="Nomor Batch"
                            onChange={handleCreateChange}
                            value={createForm.batch}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div>
                            <label htmlFor="tanggalKadaluarsa" className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Kadaluarsa
                            </label>
                            <input
                                id="tanggalKadaluarsa"
                                name="tanggalKadaluarsa"
                                type="date"
                                onChange={handleCreateChange}
                                value={createForm.tanggalKadaluarsa}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-semibold transition duration-300"
                        >
                            Buat Obat
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">Cari Obat</h2>
                    <form onSubmit={handleQuerySubmit} className="flex space-x-2">
                        <input
                            placeholder="Masukkan ID Obat"
                            onChange={(e) => setQueryId(e.target.value)}
                            value={queryId}
                            required
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-semibold transition duration-300"
                        >
                            Cari
                        </button>
                    </form>
                </div>
            </div>

            {/* Kolom Kanan: Hasil */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">Hasil Transaksi</h2>
                <div className="mt-4 p-4 bg-gray-50 rounded-md h-full">
                    <p className="text-gray-600 italic mb-4">{message || "Hasil akan ditampilkan di sini..."}</p>
                    {result && (
                    <pre className="bg-gray-800 text-white p-4 rounded-md text-sm overflow-x-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                    )}
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}

export default App;
