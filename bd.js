// DataBase
const mysql = require("mysql-await");

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "IEI",
});
con.connect(function (err) {
  if (err) {
    console.log("Error connecting to Db");
    return;
  }
  console.log("Connection established");
});

module.exports = { con };
