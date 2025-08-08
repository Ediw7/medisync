import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

function LoginPage() {
    const [form, setForm] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { role } = useParams();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', form);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);
            localStorage.setItem('namaResmi', res.data.namaResmi);
            
            const userRole = res.data.role;
            if (userRole !== role) {
                setError(`Login gagal. Akun ini bukan untuk peran ${role}.`);
                return;
            }

            if (userRole === 'produsen') navigate('/produsen/dashboard');
            else if (userRole === 'pbf') navigate('/pbf/dashboard');
            else if (userRole === 'apotek') navigate('/apotek/dashboard');
            
        } catch (error) {
            setError(error.response?.data?.message || 'Terjadi kesalahan saat login');
        }
    };

    const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
                <div className="flex justify-center mb-6">
                    <div className="bg-green-100 rounded-full p-4">
                        <Lock className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Login {displayRole}</h1>
                    <p className="text-gray-500 mt-2">Masuk ke dashboard untuk mengelola produk Anda</p>
                </div>

                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={form.username}
                                onChange={handleChange}
                                placeholder="Masukkan username Anda"
                                required
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={form.password}
                                onChange={handleChange}
                                placeholder="********"
                                required
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <div className="text-right mt-2">
                            <Link to="/forgot-password" className="text-sm text-green-600 hover:underline">Lupa Password?</Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-semibold transition duration-300"
                    >
                        Login
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        Belum punya akun? <Link to={`/register/${role}`} className="text-green-600 hover:underline font-medium">Daftar Sekarang</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;