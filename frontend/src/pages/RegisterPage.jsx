import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, User, Mail, Lock, Building, FileBadge, MapPin } from 'lucide-react';

// PERBAIKAN #1: Komponen InputField dipindahkan ke luar dari RegisterPage.
// Ini mencegah komponen didefinisikan ulang setiap kali ada ketikan,
// yang merupakan penyebab utama input kehilangan fokus.
const InputField = ({ name, type = "text", placeholder, icon, value, onChange }) => (
    <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        <input
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700"
        />
    </div>
);

function RegisterPage() {
    const [form, setForm] = useState({
        username: '', email: '', password: '', confirmPassword: '',
        namaResmi: '', nomorIzin: '', alamat: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const { role } = useParams();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) {
            setError('Password dan konfirmasi password tidak cocok');
            return;
        }
        try {
            await axios.post('http://localhost:5000/api/auth/register', {
                username: form.username,
                email: form.email,
                password: form.password,
                role: role,
                namaResmi: form.namaResmi,
                nomorIzin: form.nomorIzin,
                alamat: form.alamat,
            });
            alert('Registrasi berhasil. Akun Anda akan segera diverifikasi oleh admin sebelum bisa digunakan untuk login.');
            navigate(`/login/${role}`);
        } catch (error) {
            setError(error.response?.data?.message || 'Terjadi kesalahan saat registrasi');
        }
    };

    const displayRole = role.charAt(0).toUpperCase() + role.slice(1);
    
    const izinLabel = {
        produsen: "Nomor Izin Industri Farmasi (IIF)",
        pbf: "Nomor Izin PBF",
        apotek: "Nomor Surat Izin Apotek (SIA)"
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 md:p-12">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-800">Buat Akun {displayRole}</h1>
                    <p className="text-gray-500 mt-2">Lengkapi data untuk bergabung dengan jaringan MediSync.</p>
                </div>

                {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm mb-6">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Informasi Perusahaan / Apotek</h3>
                        <InputField name="namaResmi" placeholder="Nama Resmi" icon={<Building size={20} />} value={form.namaResmi} onChange={handleChange} />
                        <InputField name="nomorIzin" placeholder={izinLabel[role]} icon={<FileBadge size={20} />} value={form.nomorIzin} onChange={handleChange} />
                        {/* PERBAIKAN #2: Kolom alamat sekarang menggunakan InputField biasa (bukan textarea) */}
                        <InputField name="alamat" placeholder="Alamat Sesuai Izin" icon={<MapPin size={20} />} value={form.alamat} onChange={handleChange} />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 pt-2">Informasi Akun</h3>
                        <InputField name="email" type="email" placeholder="Email" icon={<Mail size={20} />} value={form.email} onChange={handleChange} />
                        <InputField name="username" placeholder="Username" icon={<User size={20} />} value={form.username} onChange={handleChange} />
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={20} /></div>
                            <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="Password" required className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <div className="relative">
                             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={20} /></div>
                            <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={handleChange} placeholder="Konfirmasi Password" required className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
                             <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-semibold transition-all duration-300 text-lg shadow-lg hover:shadow-emerald-200">
                            Ajukan Pendaftaran
                        </button>
                    </div>
                </form>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        Sudah punya akun? <Link to={`/login/${role}`} className="text-emerald-600 hover:underline font-medium">Login Sekarang</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
