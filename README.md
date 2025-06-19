# Proyek MediSync - Dokumentasi Pengembangan

Selamat datang di tim MediSync! Dokumen ini adalah panduan lengkap untuk melakukan setup, menjalankan, dan berkontribusi pada proyek ini.

## Gambaran Umum Proyek

MediSync adalah sebuah Decentralized Application (DApp) yang dibangun di atas Hyperledger Fabric untuk melacak alur distribusi obat dari produsen hingga ke apotek.

Aplikasi ini terdiri dari tiga komponen utama:
1.  **Jaringan Blockchain (Hyperledger Fabric):** Bertindak sebagai *backend on-chain* yang mencatat semua transaksi secara aman dan transparan. Dijalankan menggunakan Docker.
2.  **Server API (Node.js/Express):** Bertindak sebagai *middleware* yang menyediakan REST API untuk berkomunikasi dengan jaringan blockchain.
3.  **Aplikasi Klien (React/Vite):** Bertindak sebagai *frontend* atau antarmuka pengguna (UI) tempat pengguna berinteraksi dengan aplikasi.

---

## 1. Prasyarat (Wajib Di-install)

Sebelum memulai, pastikan perangkat Anda telah ter-install semua software berikut:

* **Git:** Untuk mengelola kode sumber.
* **Docker & Docker Compose:** Untuk menjalankan jaringan blockchain. Pastikan layanan Docker sedang berjalan di sistem Anda.
* **Node.js:** Versi 16 atau yang lebih baru.
* **cURL:** Alat command-line untuk mentransfer data.
* **Go Language:** Versi 1.18 atau yang lebih baru (diperlukan oleh beberapa skrip Fabric).

---

## 2. Setup Awal (Hanya Dilakukan Sekali)

Ini adalah langkah-langkah yang perlu dilakukan setiap anggota tim saat pertama kali akan mulai bekerja.

### Langkah 2.1: Clone Repositori Proyek

Buka terminal dan clone repositori ini dari GitHub ke komputer lokal Anda.

git clone https://github.com/Ediw7/medisync.git
cd medisync-project


### Langkah 2.2: Konfigurasi Identitas Git
Jika ini pertama kalinya Anda menggunakan Git di komputer ini, konfigurasikan nama dan email Anda. Gunakan email yang sama dengan akun GitHub Anda.

git config --global user.name "usernmae"
git config --global user.email "emailanda@example.com"


### Langkah 2.3: Install Dependencies
Proyek ini memiliki dua set dependensi Node.js: satu untuk backend dan satu untuk frontend. Kita perlu menginstall keduanya.

# Install dependensi untuk Backend
echo "Menginstall dependensi backend..."
cd backend
npm install
cd ..

# Install dependensi untuk Frontend
echo "Menginstall dependensi frontend..."
cd frontend
npm install
cd ..

echo "Semua dependensi berhasil di-install!"
## 3. Menjalankan Lingkungan Pengembangan Lokal
Untuk bekerja secara penuh, kita perlu menjalankan ketiga komponen aplikasi secara bersamaan. Ini membutuhkan 3 jendela terminal yang berjalan secara paralel.

Terminal 1: Menjalankan Jaringan Hyperledger Fabric
Jaringan ini adalah fondasi dari segalanya dan harus dijalankan pertama kali.


# Dari direktori root proyek (medisync-project)
./network.sh restart
Proses ini akan memakan waktu beberapa menit. Ia akan membuat semua kontainer Docker (peer, orderer), membuat channel, dan men-deploy chaincode. Biarkan terminal ini tetap berjalan di background.

Terminal 2: Menjalankan Server Backend
Server ini akan menghubungkan frontend ke blockchain.


# Dari direktori root proyek (medisync-project)
cd backend

# Jalankan server
node server.js
Anda akan melihat pesan Server is running on http://localhost:3001. Biarkan terminal ini tetap berjalan.

Terminal 3: Menjalankan Aplikasi Frontend
Ini adalah antarmuka pengguna yang akan kita lihat di browser.

Bash

# Dari direktori root proyek (medisync-project)
cd frontend

# Jalankan server pengembangan Vite
npm run dev
Anda akan melihat pesan yang memberikan URL, biasanya http://localhost:5173.

Selesai!
Sekarang Anda bisa membuka http://localhost:5173 di browser Anda untuk melihat dan berinteraksi dengan aplikasi MediSync.

## 4. Alur Kerja Pengembangan (Wajib Diikuti)
Kita menggunakan alur kerja Feature Branch dengan Pull Request di GitHub.

Sinkronisasi: Sebelum mulai, selalu update branch main Anda.

git checkout main
git pull origin main
Buat Branch Baru: Buat "cabang" baru yang spesifik untuk setiap fitur atau perbaikan. Jangan pernah bekerja langsung di branch main.

Bash

# Contoh nama branch yang baik: feature/login-user
git checkout -b <nama-branch-anda>
Bekerja & Commit: Lakukan perubahan kode. Lakukan commit secara berkala dengan pesan yang jelas.


git add .
git commit -m "feat: Menambahkan halaman login"
Push ke GitHub: Push branch Anda ke repositori pusat.

git push origin <nama-branch-anda>
Buat Pull Request (PR): Buka repositori di GitHub dan buat Pull Request dari branch Anda ke branch main. Beri judul dan deskripsi yang jelas

Review & Merge: Setelah PR direview dan disetujui, akan me-merge PR tersebut ke main.

## 5. Panduan Spesifik Berdasarkan Peran
Untuk Developer Chaincode (Fokus: folder chaincode/)
Tugas Anda adalah memodifikasi logika bisnis di dalam file chaincode/medisync/javascript/lib/medisync.js.
Setelah Anda selesai dan kode Anda di-merge ke main, komunikasikan kepada EDI.
EDI akan bertanggung jawab untuk melakukan upgrade chaincode dengan cara:
Mengubah versi di network.sh (misalnya CC_VERSION menjadi "1.2" dan CC_SEQUENCE menjadi "3").
Menjalankan perintah: ./network.sh deployCC.
Untuk Developer Full-Stack (Fokus: folder backend/ dan frontend/)
Tugas Anda adalah mengembangkan API di backend dan membangun komponen UI di frontend.
Untuk bisa melakukan testing, Anda perlu menjalankan seluruh tumpukan aplikasi (Jaringan Fabric, Backend, Frontend) di komputer lokal Anda seperti yang dijelaskan pada Bagian 3.
Backend (di server.js) akan berkomunikasi dengan blockchain.
Frontend (di App.jsx) akan berkomunikasi dengan API backend.

## 6. Perintah-Perintah Penting (Cheat Sheet)
Bash

# Membangun ulang seluruh jaringan dari nol (paling sering digunakan)
./network.sh restart

# Mematikan semua kontainer jaringan
./network.sh down

# Men-deploy atau meng-upgrade chaincode (setelah ada perubahan kode chaincode)
./network.sh deployCC

# Melihat semua kontainer Docker yang berjalan
docker ps -a

# Menjalankan server backend
# (jalankan dari dalam folder 'backend')
node server.js

# Menjalankan server frontend
# (jalankan dari dalam folder 'frontend')
npm run dev
