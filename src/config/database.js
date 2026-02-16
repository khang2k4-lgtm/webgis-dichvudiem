require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,     // localhost
    port: process.env.DB_PORT,     // 5432
    user: process.env.DB_USER,     // postgres
    password: process.env.DB_PASSWORD, // 1
    database: process.env.DB_NAME  // webgis
});

// TEST CONNECTION
// pool.connect((err, client, release) => {
//     if (err) {
//         console.error('❌ KẾT NỐI POSTGRES THẤT BẠI:', err);
//     } else {
//         console.log('✅ KẾT NỐI POSTGRES THÀNH CÔNG!');
//         release();
//     }
// });

module.exports = pool;