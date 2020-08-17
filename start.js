// Dependencies
// =============================
const path = require("path");
const fs = require("fs");
//const util = require("util");
const mysql = require("mysql");
const cTable = require("console.table");

// FS *Async functions
// const readFileAsync = util.promisify(fs.readFile);
// const writeFileAsync = util.promisify(fs.writeFile);
// const appendFileAsync = util.promisify(fs.appendFile);

// SQL connection setup
const mysqlSetup = {
  host: "localhost",
  // Port setting; if not 3306
  port: 3306,
  // Username
  user: "root",
  // Read password from single line file with IIFE expression
  password: (() => String(fs.readFileSync(".mysql")).trim())(),
  // Database
  database: "company_db"
};

var connection = mysql.createConnection(mysqlSetup);

connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId);
  const query = connection.query(
      "SELECT * FROM employee " +
      "INNER JOIN role ON " + 
      "employee.role_id = role.id",
      function(err, res) {
        if (err) throw err;
        console.table(res);
        connection.end();
      }
    );

  // logs the actual query being run
  console.log(query.sql);
});

