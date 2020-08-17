// Dependencies
// =============================
const path = require("path");
const fs = require("fs");
//const util = require("util");
const mysql = require("mysql");
const cTable = require("console.table");
const inquirer = require("inquirer");

// FS *Async functions
// const readFileAsync = util.promisify(fs.readFile);
// const writeFileAsync = util.promisify(fs.writeFile);
// const appendFileAsync = util.promisify(fs.appendFile);

const mysqlCreateConnectionAsync = util.promisify(mysql.createConnection);
const mysqlQueryAsync = util.promisify(mysql.query);

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

const viewAllDepartments = async () => {
  const query = await connection.query(
    "SELECT * "+
    "FROM department",
    (err, res) => {
      if (err) throw err;
      console.clear()
      console.log(res);
      console.table(res);
    }
  );
}

const viewAllRoles = async () => {
  const query = await connection.query(
    "SELECT * "+
    "FROM role",
    (err, res) => {
      if (err) throw err;
      console.clear()
      console.log(res);
      console.table(res);
    }
  );
}

const viewAllEmployees = async () => {
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
    "role.department_id = department.id",
    (err, res) => {
      if (err) throw err;
      console.clear()
      console.log(res);
      console.table(res);
    }
  );
}

const get
const viewAllEmployeesByDept = async () => {
  return new Promise(async (resolve, reject) => {
    const dept = await connection.query(
      "SELECT name FROM department",
      async (err, res) => {
        if (err) throw err;
        let retVal = res.map(({name}) => name);
        return retVal;
      }
    );
    console.log('∞° dept=\n"'+JSON.stringify(dept)+'"');
    /* {{{ **
    ** const query = await connection.query(
    **   "SELECT "+
    **   "employee.id as id, "+
    **   "employee.first_name as first_name, "+
    **   "employee.last_name as last_name, "+
    **   "department.name as department, "+
    **   "role.salary as salary "+
    **   "FROM employee "+
    **   "INNER JOIN role ON "+ 
    **   "employee.role_id = role.id "+
    **   "INNER JOIN department ON "+ 
    **   "role.department_id = department.id"+
    **   "WHERE department = ?",
    **   (err, res) => {
    **     if (err) throw err;
    **     console.clear()
    **     console.table(res);
    **   }
    ** );
    ** }}} */
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
      case "Exit":
        continuing = false;
        break;
      default:
        reject(`Unsupported role ${inp.whichOp}`);
        break;
    }
    if (inp.addAnother) {
      await getEmployeeDetailsAll()
    }
    resolve(continuing);
  });
}

connection.connect(async function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId);
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
});

