// Dependencies
// =============================
const path = require("path");
const fs = require("fs");
const inquirer = require("inquirer");
const mysql = require("mysql");
const cTable = require("console.table");

/* {{{ **
** //const util = require("util");
** // fs *Async functions
** // const readFileAsync = util.promisify(fs.readFile);
** // const writeFileAsync = util.promisify(fs.writeFile);
** // const appendFileAsync = util.promisify(fs.appendFile);
** 
** // mysql *Async functions
** //const mysqlCreateConnectionAsync = util.promisify(mysql.createConnection);
** //const mysqlQueryAsync = util.promisify(mysql.query);
** }}} */

// Follow example code to create a custom class providing a Promise object
// wrapper object around the core mysql methods.
// CITE: https://codeburst.io/node-js-mysql-and-promises-4c3be599909b
class Database {
  constructor(config) {
    this.connection = mysql.createConnection(config);
  }
  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err)
          return reject(err);
        resolve(rows);
      });
    });
  }
  end() {
    return new Promise((resolve, reject) => {
      this.connection.end(err => {
        if (err)
          return reject(err);
        resolve();
      });
    });
  }
}

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

const connection = new Database(mysqlSetup);

const viewAllDepartments = async () => {
  const res = await connection.query(
    "SELECT * "+
    "FROM department",
    ''  // Dummy parameter to match prototype in wrapper object
  );
  console.log(res);
  console.table(res);
}

const viewAllRoles = async () => {
  const query = await connection.query(
    "SELECT * "+
    "FROM role",
    '', // Dummy parameter to match prototype in wrapper object
    (err, res) => {
      if (err) throw err;
      console.clear()
      console.log(res);
      console.table(res);
    }
  );
}

const viewAllEmployees = async () => {
  const res = await connection.query(
    "SELECT "+
    "employee.id as id, "+
    "employee.first_name as first_name, "+
    "employee.last_name as last_name, "+
    "department.name as department, "+
    "role.salary as salary "+
    "FROM employee "+
    "INNER JOIN role ON "+ 
    "employee.role_id = role.id "+
    "INNER JOIN department ON "+ 
    "role.department_id = department.id",
    '', // Dummy parameter to match prototype in wrapper object
    (err, res) => {
      if (err) throw err;
      console.clear()
      console.log(res);
      console.table(res);
    }
  );
}

const viewAllEmployeesByDept = async () => {
  const dept = await connection.query(
    "SELECT name FROM department",
    '', // Dummy parameter to match prototype in wrapper object
    async (err, res) => {
      if (err) throw err;
      let retVal = res.map(({name}) => name);
      return retVal;
    }
  );
  console.log('∞° dept=\n"'+JSON.stringify(dept)+'"');
  const questions = [ // {{{
    {
      type: "list", name: "whichDept",
      message: "Which department?",
      choices: dept,
    }
  ];                  // }}}
  let inp = await inquirer.prompt(questions);
  const query = await connection.query(
    "SELECT "+
    "employee.id as id, "+
    "employee.first_name as first_name, "+
    "employee.last_name as last_name, "+
    "department.name as department, "+
    "role.salary as salary "+
    "FROM employee "+
    "INNER JOIN role ON "+ 
    "employee.role_id = role.id "+
    "INNER JOIN department ON "+ 
    "role.department_id = department.id"+
    "WHERE department = ?",
    [inp.whichDept],
    (err, res) => {
      if (err) throw err;
      console.clear()
      console.table(res);
    }
  );
}

const mainMenu = async () => {
  return new Promise(async (resolve, reject) => {
    let continuing = true;
    const questions = [ // {{{
      {
        type: "list", name: "whichOp",
        message: "Which operation?",
        choices: [
          "Exit",
          new inquirer.Separator(),
          "View All Departments",
          "View All Roles",
          "View All Employees",
          "View All Employees by Department",
          "View All Employees by Manager",
          new inquirer.Separator(),
          "Add Department",
          "Add Role",
          "Add Employee",
          new inquirer.Separator(),
          "Update Employee Role",
          "Update Employee Manager",
        ],
      }
    ];                  // }}}
    let inp = await inquirer.prompt(questions);
    switch (inp.whichOp) {
      case "View All Departments":
        await viewAllDepartments();
        break;
      case "View All Roles":
        await viewAllRoles();
        break;
      case "View All Employees":
        await viewAllEmployees();
        break;
      case "View All Employees by Department":
        await viewAllEmployeesByDept();
        break;
      case "View All Employees by Manager":
      case "Update Employee Role":
      case "Update Employee Manager":
        break;
      case "Exit":
        continuing = false;
        break;
      default:
        reject(`Unsupported role ${inp.whichOp}`);
        break;
    }
    resolve(continuing);
  });
}

// Implement main() function as an IIFE to run the program
const main = (async () => {
  /* {{{ **
  ** const query = connection.query(
  **   "SELECT * FROM employee " +
  **   "INNER JOIN role ON " + 
  **   "employee.role_id = role.id",
  **   (err, res) => {
  **     if (err) throw err;
  **     console.table(res);
  **     connection.end();
  **   }
  ** );
  ** 
  ** // logs the actual query being run
  ** console.log(query.sql);
  ** }}} */
  let continuing = false
  do {
    console.log('Employee Management System');
    continuing = await mainMenu()
  }
  while (continuing);
  connection.end();
})();

