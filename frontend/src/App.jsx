import { useState } from 'react';
import axios from 'axios';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-800 mb-8">MediSync DApp</h1>

      <div className="w-full max-w-7xl flex flex-col md:flex-row md:space-x-6 mb-6">
        <div className="flex-1 bg-white rounded-lg shadow-lg p-6 mb-6 md:mb-0">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Buat Obat Baru (Produsen)</h2>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <input
                name="id"
                placeholder="ID Obat (e.g., OBAT002)"
                onChange={handleCreateChange}
                value={createForm.id}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                name="nama"
                placeholder="Nama Obat"
                onChange={handleCreateChange}
                value={createForm.nama}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                name="batch"
                placeholder="Nomor Batch"
                onChange={handleCreateChange}
                value={createForm.batch}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300"
            >
              Buat Obat
            </button>
          </form>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cari Obat</h2>
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
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
            >
              Cari
            </button>
          </form>
        </div>
      </div>

      <div className="w-full max-w-7xl bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Hasil</h2>
        <p className="text-gray-600 italic mb-4">{message}</p>
        {result && (
          <pre className="bg-gray-100 p-4 rounded-md text-sm text-gray-800 overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default App;