const mysql = require('mysql');

const dbConfig = {
  host: "HOST",
  user: "USER",
  password: "PW" ,
  database: "DB",
  port: "PORT",
  timezone: "TIMEZONE",
  ssl: "SSL" ,
};

const db_mysql = mysql.createConnection(dbConfig);

module.exports = db_mysql;