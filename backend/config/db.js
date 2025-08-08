const mysql = require('mysql2');

// Menggunakan connection pool untuk efisiensi
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Ganti dengan user MySQL Anda
    password: '', // Ganti dengan password MySQL Anda
    database: 'medisync_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


module.exports = pool.promise();