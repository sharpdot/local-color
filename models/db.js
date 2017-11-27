/**
 * data/db.js
 *
 * Houses MySQL Connection Pool
 **/

var mysql = require('mysql');

require('dotenv');

var SQL_CONNSTR = {
    connectionLimit: process.env.DB_CONN_LIMIT,
    user:            process.env.DB_USER,
    password:        process.env.DB_PASS,
    host:            process.env.DB_HOST,
    port:            process.env.DB_PORT,
    database:        process.env.DB_NAME,
};

var pool = mysql.createPool( SQL_CONNSTR );

module.exports = pool;
