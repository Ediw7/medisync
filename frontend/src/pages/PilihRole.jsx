import { Link } from 'react-router-dom';
import { Factory, Truck, Store } from 'lucide-react';

function PilihRole() {
  const roles = [
    { name: 'Produsen', to: '/login/produsen', icon: <Factory size={48} />, description: 'Manufaktur dan produksi obat-obatan' },
    { name: 'PBF', to: '/login/pbf', icon: <Truck size={48} />, description: 'Distribusi dan penyaluran produk farmasi' },
    { name: 'Apotek', to: '/login/apotek', icon: <Store size={48} />, description: 'Pelayanan obat dan konsultasi farmasi' }
  ];

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">Pilih Peran Anda</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Pilih peran Anda untuk masuk ke platform dan mulai mengelola rantai pasok farmasi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {roles.map((role) => (
          <Link to={role.to} key={role.name} className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 h-full flex flex-col items-center justify-center text-center
                            transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-green-500 border-2 border-transparent">
              <div className="text-green-600 mb-4">
                {role.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{role.name}</h2>
              <p className="text-gray-500">
                {role.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default PilihRole;