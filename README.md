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


Dari direktori root proyek (medisync-project)

./network.sh restart

Proses ini akan memakan waktu beberapa menit. Ia akan membuat semua kontainer Docker (peer, orderer), membuat channel, dan men-deploy chaincode. Biarkan terminal ini tetap berjalan di background.

Terminal 2: Menjalankan Server Backend
Server ini akan menghubungkan frontend ke blockchain.


Dari direktori root proyek (medisync-project)

cd backend

Jalankan server

node server.js

Anda akan melihat pesan Server is running on http://localhost:3001. Biarkan terminal ini tetap berjalan.

Terminal 3: Menjalankan Aplikasi Frontend
Ini adalah antarmuka pengguna yang akan kita lihat di browser.

Bash

Dari direktori root proyek (medisync-project)

cd frontend

Jalankan server pengembangan Vite

npm run dev

Anda akan melihat pesan yang memberikan URL, biasanya http://localhost:5173.

Selesai!
Sekarang Anda bisa membuka http://localhost:5173 di browser Anda untuk melihat dan berinteraksi dengan aplikasi MediSync.

## 4. Alur Kerja Pengembangan (Wajib Diikuti)
Ini adalah bagian terpenting untuk kerja tim agar tidak terjadi konflik kode. Prinsip utamanya adalah: JANGAN PERNAH BEKERJA LANGSUNG DI BRANCH main.

Siklus Kerja: Studi Kasus Developer Frontend
Skenario: Anda adalah developer frontend, tugas Anda adalah "mengubah tombol 'Cari' menjadi warna hijau".

Langkah A: Sinkronisasi Kode
Pastikan kode di komputer Anda adalah versi terbaru dari main di GitHub.

// Pindah ke branch utama

git checkout main

// Ambil perubahan terbaru dari GitHub

git pull origin main

Langkah B: Buat Branch Baru
Buat "ruang kerja" baru yang terisolasi khusus untuk tugas ini.

//Buat branch baru dan langsung pindah ke dalamnya

git checkout -b frontend/style-tombol-cari

Langkah C: Bekerja & Test
Lakukan perubahan pada kode (misalnya di file frontend/src/App.css). Simpan, lalu test secara lokal untuk memastikan semuanya berfungsi.


Langkah D: Commit Perubahan
Simpan "snapshot" dari pekerjaan Anda ke dalam riwayat Git.

1. Tambahkan file yang telah Anda ubah
2. 
git add .

2. Buat catatan permanen (commit) dengan pesan yang jelas

git commit -m "style(frontend): Mengubah warna tombol 'Cari' menjadi hijau"

Langkah E: Push Branch ke GitHub

Kirim branch baru Anda beserta commit-nya ke repositori pusat di GitHub.

git push

Langkah F: Buat Pull Request (PR)
Ini adalah cara Anda mengajukan hasil kerja Anda untuk digabungkan ke main.

Buka halaman repositori proyek di GitHub.

Anda akan melihat notifikasi tentang branch baru Anda. Klik tombol "Compare & pull request".

Beri judul dan deskripsi yang jelas untuk PR Anda.

Di sebelah kanan, pilih "Reviewers" dan tambahkan Ketua Tim.

Langkah H: Kembali ke Awal
Pekerjaan Anda selesai! Sekarang, kembali ke terminal untuk bersiap mengerjakan tugas selanjutnya.

// 1. Pindah lagi ke branch utama

git checkout main

// 2. Ambil lagi versi terbaru (yang sekarang sudah berisi perubahan Anda)

git pull origin main


## 5. Panduan Spesifik Berdasarkan Peran
Untuk Developer Chaincode (Fokus: folder chaincode/)
modifikasi logika bisnis di dalam file chaincode/medisync/javascript/lib/medisync.js.

Setelah selesai dan kode di-merge ke main, lakukan upgrade chaincode dengan cara:

Mengubah versi di network.sh (misalnya CC_VERSION menjadi "1.2" dan CC_SEQUENCE menjadi "3").

Menjalankan perintah: ./network.sh deployCC.

Untuk Developer Full-Stack (Fokus: folder backend/ dan frontend/)

mengembangkan API di backend dan membangun komponen UI di frontend.

Untuk bisa melakukan testing, perlu menjalankan seluruh tumpukan aplikasi (Jaringan Fabric, Backend, Frontend) di komputer lokal Anda seperti yang dijelaskan pada Bagian 3.


Backend (di server.js) akan berkomunikasi dengan blockchain.

Frontend (di App.jsx) akan berkomunikasi dengan API backend.

## 6. Perintah-Perintah Penting (Cheat Sheet)

Membangun ulang seluruh jaringan dari nol (paling sering digunakan)

# ./network.sh restart

Mematikan semua kontainer jaringan

# ./network.sh down

Men-deploy atau meng-upgrade chaincode (setelah ada perubahan kode chaincode)

# ./network.sh deployCC

Melihat semua kontainer Docker yang berjalan

# docker ps -a

Menjalankan server backend
(jalankan dari dalam folder 'backend')

# node server.js

Menjalankan server frontend
(jalankan dari dalam folder 'frontend')

# npm run dev
