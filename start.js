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

// Enable DEBUG to debug query output
const DEBUG = true;

// Follow example code to create a custom class providing a Promise object
// wrapper object around the core mysql methods.
// CITE: https://codeburst.io/node-js-mysql-and-promises-4c3be599909b
// Save the last SQL statement for reference in sql property
class Database {
  constructor(config) {
    this.connection = mysql.createConnection(config);
    this.sql = ''; // No SQL yet
  }
  query(sql, args) {
    return new Promise((resolve, reject) => {
      let q = this.connection.query(sql, args, (err, rows) => {
        this.sql = q.sql;
        if (err)
          return reject(err);
        resolve(rows);
      });
    });
  }
  end() {
    return new Promise((resolve, reject) => {
      this.connection.end(err => {
        this.sql = null; // No connection!
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
    ""  // Dummy parameter to match prototype in wrapper object
  );
  console.clear()
  if (DEBUG) { // {{{ Debugging output
    console.log(res);
  } //DEBUG       }}} End debugging
  console.table(res);
}

const viewAllRoles = async () => {
  const res = await connection.query(
    "SELECT * "+
    "FROM role",
    ""  // Dummy parameter to match prototype in wrapper object
  );
  console.clear()
  if (DEBUG) { // {{{ Debugging output
    console.log(res);
  } //DEBUG       }}} End debugging
  console.table(res);
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
    ""  // Dummy parameter to match prototype in wrapper object
  );
  console.clear()
  if (DEBUG) { // {{{ Debugging output
    console.log(res);
  } //DEBUG       }}} End debugging
  console.table(res);
}

const viewAllEmployeesByDept = async () => {
  const depts = await connection.query(
    "SELECT name FROM department",
    ""  // Dummy parameter to match prototype in wrapper object
  );
  if (DEBUG) { // {{{ Debugging output
    console.log('depts=\n"'+JSON.stringify(depts)+'"');
  } //DEBUG       }}} End debugging
  const questions = [ // {{{
    {
      type: "list", name: "whichDept",
      message: "Which department?",
      choices: depts
    }
  ];                  // }}}
  let inp = await inquirer.prompt(questions);
  if (DEBUG) { // {{{ Debugging output
    console.log('inp.whichDept=\n"'+inp.whichDept+'"');
  } //DEBUG       }}} End debugging
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
    "role.department_id = department.id "+
    "WHERE department.name = ?",
    [inp.whichDept]
  );
  console.clear()
  if (DEBUG) { // {{{ Debugging output
    console.log(res);
  } //DEBUG       }}} End debugging
  console.table(res);
}

const viewAllEmployeesByMgr = async () => {
  const mgrs = await connection.query(
    "SELECT DISTINCT "+
    "CONCAT(m.last_name,', ',m.first_name) as name, "+
    "e.manager_id as id "+
    "FROM employee e "+
    "INNER JOIN employee m ON "+
    "e.manager_id = m.id ",
    ""  // Dummy parameter to match prototype in wrapper object
  );
  // Parse results to managers array
  let managers = mgrs.map(obj => obj.name);
  if (DEBUG) { // {{{ Debugging output
    console.log('mgrs=\n"'+JSON.stringify(mgrs)+'"');
    console.log('managers=\n"'+JSON.stringify(managers)+'"');
  } //DEBUG       }}} End debugging
  const questions = [ // {{{
    {
      type: "list", name: "whichMgr",
      message: "Which manager?",
      choices: managers
    }
  ];                  // }}}
  let inp = await inquirer.prompt(questions);
  if (DEBUG) { // {{{ Debugging output
    console.log('inp.whichMgr=\n"'+inp.whichMgr+'"');
  } //DEBUG       }}} End debugging
  const findMgr = (slot) => slot.name == inp.whichMgr;
  const manager_id = mgrs[mgrs.findIndex(findMgr)].id
  if (DEBUG) { // {{{ Debugging output
    console.log('manager_id=\n"'+manager_id+'"');
  } //DEBUG       }}} End debugging
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
    "role.department_id = department.id "+
    "WHERE employee.manager_id = ?",
    [manager_id]
  );
  console.clear()
  if (DEBUG) { // {{{ Debugging output
    console.log(res);
  } //DEBUG       }}} End debugging
  console.table(res);
}

const addEmployee = async () => {
  const roles = await connection.query(
    "SELECT title FROM role",
    ""  // Dummy parameter to match prototype in wrapper object
  );
  if (DEBUG) { // {{{ Debugging output
    console.log('roles=\n"'+JSON.stringify(roles)+'"');
  } //DEBUG       }}} End debugging
  const mgrs = await connection.query(
    "SELECT DISTINCT "+
    "CONCAT(m.last_name,', ',m.first_name) as name, "+
    "e.manager_id as id "+
    "FROM employee e "+
    "INNER JOIN employee m ON "+
    "e.manager_id = m.id ",
    ""  // Dummy parameter to match prototype in wrapper object
  );
  // Parse results to managers array
  let managers = mgrs.map(obj => obj.name);
  if (DEBUG) { // {{{ Debugging output
    console.log('mgrs=\n"'+JSON.stringify(mgrs)+'"');
    console.log('managers=\n"'+JSON.stringify(managers)+'"');
  } //DEBUG       }}} End debugging
  const questions = [ // {{{
    {
      type: "input", name: "firstName",
      message: "First name?",
    },
    {
      type: "input", name: "lastName",
      message: "Last name?",
    },
    {
      type: "list", name: "whichRole",
      message: "Which role?",
      choices: roles
    },
    {
      type: "confirm", name: "pickMgr",
      message: "Will a manager be assigned?",
    },
    {
      type: "list", name: "whichMgr",
      message: "Which manager?",
      choices: managers,
      when: (answers) => (answers.pickMgr)
    }
  ];                  // }}}
  let inp = await inquirer.prompt(questions);
  let manager_id = null; // By design manager_id defaults to null
  if (inp.pickMgr) {
    const findMgr = (slot) => slot.name == inp.whichMgr;
    manager_id = mgrs[mgrs.findIndex(findMgr)].id
  }
  if (DEBUG) { // {{{ Debugging output
  } //DEBUG       }}} End debugging
  if (DEBUG) { // {{{ Debugging output
    console.log('inp.whichDept=\n"'+inp.whichDept+'"');
    console.log('manager_id=\n"'+manager_id+'"');
  } //DEBUG       }}} End debugging
  const args = {
    first_name: inp.firstName,
    last_name: inp.lastName,
    role_id: inp.whichRole,
    manager_id: manager_id
  }
  const res = await connection.query(
    "INSERT INTO employee SET ?",
    args
  );
  console.clear()
  if (DEBUG) { // {{{ Debugging output
    console.log(res);
  } //DEBUG       }}} End debugging
  console.table(res);
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
        await viewAllEmployeesByMgr();
        break;
      case "Add Department":
        break;
      case "Add Role":
        break;
      case "Add Employee":
        await addEmployee();
        break;
      case "Update Employee Role":
        break;
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
  let continuing = false;
  console.clear();
  do {
    console.log('Employee Management System');
    continuing = await mainMenu()
  }
  while (continuing);
  connection.end();
})();
