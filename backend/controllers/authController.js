const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kunci-rahasia-default';

const authController = {
    register: async (req, res) => {
        const { username, email, password, role, namaResmi, nomorIzin, alamat } = req.body;
        try {
            if (!namaResmi || !nomorIzin || !alamat) {
                return res.status(400).json({ message: 'Informasi perusahaan/izin wajib diisi.' });
            }
            
            const validRoles = ['produsen', 'pbf', 'apotek'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ message: 'Role tidak valid' });
            }
            await User.create(username, email, password, role, namaResmi, nomorIzin, alamat);
            // --- PERUBAHAN PESAN ---
            res.status(201).json({ message: 'Registrasi berhasil. Silakan login.' });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Username, email, atau nomor izin sudah digunakan' });
            }
            res.status(500).json({ message: 'Kesalahan server', error: err.message });
        }
    },

    login: async (req, res) => {
        const { username, password } = req.body;
        try {
            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(401).json({ message: 'Username atau password salah' });
            }

            // --- PENGECEKAN STATUS VERIFIKASI DIHAPUS ---

            const isMatch = await User.comparePassword(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Username atau password salah' });
            }

            const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
             res.json({ 
                token, 
                role: user.role, 
                username: user.username,
                namaResmi: user.nama_resmi 
            });
        } catch (err) {
            res.status(500).json({ message: 'Kesalahan server', error: err.message });
        }
    },
};

module.exports = authController;
