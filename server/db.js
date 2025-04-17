const mysql = require('mysql2');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'root1root1',
  database: 'web_education_bd',
  ssl: { rejectUnauthorized: false } 
});

module.exports = pool.promise();
