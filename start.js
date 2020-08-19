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
  try {
    // Query for all rows in role
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
  } catch (error) {
    console.log(error.message);
  }
}

const viewAllEmployees = async () => {
  try {
    // Query for all rows in employee also
    // joining in important information
    // from role and department
    const res = await connection.query(
      "SELECT "+
      "employee.id as id, "+
      "employee.first_name as first_name, "+
      "employee.last_name as last_name, "+
      "role.title as job_title, "+
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
  } catch (error) {
    console.log(error.message);
  }
}

const viewAllEmployeesByDept = async () => {
  try {
    // Query first to get list of departments
    // then ask for department on which to filter.
    const dept = await connection.query(
      "SELECT name FROM department",
      ""  // Dummy parameter to match prototype in wrapper object
    );
    // Parse results to depts array
    const depts = dept.map(obj => obj.name);
    if (DEBUG) { // {{{ Debugging output
      console.log('dept=\n"'+JSON.stringify(dept)+'"');
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
    // Query for all rows in employee also
    // joining in important information
    // from role and department
    const res = await connection.query(
      "SELECT "+
      "employee.id as id, "+
      "employee.first_name as first_name, "+
      "employee.last_name as last_name, "+
      "role.title as job_title, "+
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
  } catch (error) {
    console.log(error.message);
  }
}

const viewAllEmployeesByMgr = async () => {
  try {
    // Query first to get list of managers with ids
    // then ask for manager on which to filter,
    // and cross reference before filtering by manager id.
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
    const managers = mgrs.map(obj => obj.name);
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
    // Lookup up id(s) by value for use in query
    const findMgr = (slot) => slot.name == inp.whichMgr;
    const manager_id = mgrs[mgrs.findIndex(findMgr)].id
    if (DEBUG) { // {{{ Debugging output
      console.log('manager_id=\n"'+manager_id+'"');
    } //DEBUG       }}} End debugging
    // Query for all rows in employee also
    // joining in important information
    // from role and department
    const res = await connection.query(
      "SELECT "+
      "employee.id as id, "+
      "employee.first_name as first_name, "+
      "employee.last_name as last_name, "+
      "role.title as job_title, "+
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
  } catch (error) {
    console.log(error.message);
  }
}

const addDepartment = async () => {
  try {
    const questions = [ // {{{
      {
        type: "input", name: "name",
        message: "Department name?",
      },
    ];                  // }}}
    let inp = await inquirer.prompt(questions);
    const args = {
      name: inp.name
    }
    const res = await connection.query(
      "INSERT INTO department SET ?",
      args
    );
    /* {{{ **
    ** console.clear()
    ** }}} */
    if (DEBUG) { // {{{ Debugging output
      console.log(res);
      console.table(res);
    } //DEBUG       }}} End debugging
    console.log(res.affectedRows + " row(s) inserted!\n");
  } catch (error) {
    console.log(error.message);
  }
}

const addRole = async () => {
  try {
    // Query first to get list of departments with ids
    // then ask for department to be added,
    // and cross reference before inserting with department id.
    const dept = await connection.query(
      "SELECT name,id FROM department",
      ""  // Dummy parameter to match prototype in wrapper object
    );
    // Parse results to depts array
    const depts = dept.map(obj => obj.name);
    if (DEBUG) { // {{{ Debugging output
      console.log('dept=\n"'+JSON.stringify(dept)+'"');
      console.log('depts=\n"'+JSON.stringify(depts)+'"');
    } //DEBUG       }}} End debugging
    const questions = [ // {{{
      {
        type: "input", name: "title",
        message: "Title for the role?",
      },
      {
        type: "input", name: "salary",
        message: "Salary amount?",
        validate: (val) => {
          let pass = val.match(
            /^\d+$/
          );
          return (pass)
            ? true
            : "Salary needs to be a number";
        }
      },
      {
        type: "list", name: "whichDept",
        message: "Which department?",
        choices: depts
      }
    ];                  // }}}
    let inp = await inquirer.prompt(questions);
    // Lookup up id(s) by value for use in query
    const findDept = (slot) => slot.name == inp.whichDept;
    dept_id = dept[dept.findIndex(findDept)].id
    if (DEBUG) { // {{{ Debugging output
      console.log('inp.whichDept=\n"'+inp.whichDept+'"');
      console.log('dept_id=\n"'+dept_id+'"');
    } //DEBUG       }}} End debugging
    const args = {
      title: inp.title,
      salary: inp.salary,
      department_id: dept_id
    }
    if (DEBUG) { // {{{ Debugging output
      console.log('args=\n"'+args+'"');
      console.log('args=\n"'+JSON.stringify(args)+'"');
    } //DEBUG       }}} End debugging
    const res = await connection.query(
      "INSERT INTO role SET ?",
      args
    );
    /* {{{ **
    ** console.clear()
    ** }}} */
    if (DEBUG) { // {{{ Debugging output
      console.log(res);
      console.table(res);
    } //DEBUG       }}} End debugging
    console.log(res.affectedRows + " row(s) inserted!\n");
  } catch (error) {
    console.log(error.message);
  }
}

const addEmployee = async () => {
  try {
    // Query first to get list of roles with ids
    // then ask for role to be added,
    // and cross reference before inserting with role id.
    const role = await connection.query(
      "SELECT title, id FROM role",
      ""  // Dummy parameter to match prototype in wrapper object
    );
    // Parse results to roles array
    const roles = role.map(obj => obj.title);
    if (DEBUG) { // {{{ Debugging output
      console.log('role=\n"'+JSON.stringify(role)+'"');
      console.log('roles=\n"'+JSON.stringify(roles)+'"');
    } //DEBUG       }}} End debugging
    // Query first to get list of managers with ids
    // then ask for manager to be added,
    // and cross reference before inserting with manager id.
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
    const managers = mgrs.map(obj => obj.name);
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
    // Lookup up id(s) by value for use in query
    const findRole = (slot) => slot.title == inp.whichRole;
    role_id = role[role.findIndex(findRole)].id
    if (DEBUG) { // {{{ Debugging output
      console.log('inp.whichRole=\n"'+inp.whichRole+'"');
      console.log('role_id=\n"'+role_id+'"');
    } //DEBUG       }}} End debugging
    let manager_id = null; // By design manager_id defaults to null
    if (inp.pickMgr) {
      const findMgr = (slot) => slot.name == inp.whichMgr;
      manager_id = mgrs[mgrs.findIndex(findMgr)].id
    }
    const args = {
      first_name: inp.firstName,
      last_name: inp.lastName,
      role_id: role_id,
      manager_id: manager_id
    }
    if (DEBUG) { // {{{ Debugging output
      console.log('args=\n"'+args+'"');
      console.log('args=\n"'+JSON.stringify(args)+'"');
    } //DEBUG       }}} End debugging
    const res = await connection.query(
      "INSERT INTO employee SET ?",
      args
    );
    /* {{{ **
    ** console.clear()
    ** }}} */
    if (DEBUG) { // {{{ Debugging output
      console.log(res);
      console.table(res);
    } //DEBUG       }}} End debugging
    console.log(res.affectedRows + " row(s) inserted!\n");
  } catch (error) {
    console.log(error.message);
  }
}

const updateEmployeeRole = async () => {
  try {
    // Query first to get list of employees with ids
    // then ask which employee should be updated
    // and cross reference before inserting with employee id.
    const emps = await connection.query(
      "SELECT DISTINCT "+
      "CONCAT(e.last_name,', ',e.first_name) as name, "+
      "e.id as id "+
      "FROM employee e ",
      ""  // Dummy parameter to match prototype in wrapper object
    );
    // Parse results to roles array
    const employees = emps.map(obj => obj.name);
    if (DEBUG) { // {{{ Debugging output
      console.log('emps=\n"'+JSON.stringify(emps)+'"');
      console.log('employees=\n"'+JSON.stringify(employees)+'"');
    } //DEBUG       }}} End debugging
    // Query first to get list of roles with ids
    // then ask for role to be added,
    // and cross reference before inserting with role id.
    const role = await connection.query(
      "SELECT title, id FROM role",
      ""  // Dummy parameter to match prototype in wrapper object
    );
    // Parse results to roles array
    const roles = role.map(obj => obj.title);
    if (DEBUG) { // {{{ Debugging output
      console.log('role=\n"'+JSON.stringify(role)+'"');
      console.log('roles=\n"'+JSON.stringify(roles)+'"');
    } //DEBUG       }}} End debugging
    /* {{{ **
    ** // Query first to get list of managers with ids
    ** // then ask for manager to be added,
    ** // and cross reference before inserting with manager id.
    ** const mgrs = await connection.query(
    **   "SELECT DISTINCT "+
    **   "CONCAT(m.last_name,', ',m.first_name) as name, "+
    **   "e.manager_id as id "+
    **   "FROM employee e "+
    **   "INNER JOIN employee m ON "+
    **   "e.manager_id = m.id ",
    **   ""  // Dummy parameter to match prototype in wrapper object
    ** );
    ** // Parse results to managers array
    ** const managers = mgrs.map(obj => obj.name);
    ** if (DEBUG) { // {{{ Debugging output
    **   console.log('mgrs=\n"'+JSON.stringify(mgrs)+'"');
    **   console.log('managers=\n"'+JSON.stringify(managers)+'"');
    ** } //DEBUG       }}} End debugging
    ** }}} */
    const questions = [ // {{{
      {
        type: "list", name: "whichEmp",
        message: "Update which employee?",
        choices: employees
      },
      {
        type: "list", name: "whichRole",
        message: "Set to which role?",
        choices: roles
      }
    ];                  // }}}
    let inp = await inquirer.prompt(questions);
    // Lookup up id(s) by value for use in query
    if (DEBUG) { // {{{ Debugging output
      console.log('inp.whichEmp=\n"'+inp.whichEmp+'"');
    } //DEBUG       }}} End debugging
    const findEmp = (slot) => slot.name == inp.whichEmp;
    emp_id = emps[emps.findIndex(findEmp)].id
    if (DEBUG) { // {{{ Debugging output
      console.log('inp.whichEmp=\n"'+inp.whichEmp+'"');
      console.log('emp_id=\n"'+emp_id+'"');
    } //DEBUG       }}} End debugging
    const findRole = (slot) => slot.title == inp.whichRole;
    role_id = role[role.findIndex(findRole)].id
    if (DEBUG) { // {{{ Debugging output
      console.log('inp.whichRole=\n"'+inp.whichRole+'"');
      console.log('role_id=\n"'+role_id+'"');
    } //DEBUG       }}} End debugging
    /* {{{ **
    ** let manager_id = null; // By design manager_id defaults to null
    ** if (inp.pickMgr) {
    **   const findMgr = (slot) => slot.name == inp.whichMgr;
    **   manager_id = mgrs[mgrs.findIndex(findMgr)].id
    ** }
    ** }}} */
    const args = [
      {
        role_id: role_id
      },
      {
        id: emp_id
      }
    ];
    if (DEBUG) { // {{{ Debugging output
      console.log('args=\n"'+args+'"');
      console.log('args=\n"'+JSON.stringify(args)+'"');
    } //DEBUG       }}} End debugging
    const res = await connection.query(
      "UPDATE employee SET ? WHERE ?",
      args
    );
    /* {{{ **
    ** console.clear()
    ** }}} */
    if (DEBUG) { // {{{ Debugging output
      console.log('sql=\n"'+connection.sql+'"');
      console.log(res);
      console.table(res);
    } //DEBUG       }}} End debugging
    console.log(res.affectedRows + " row(s) updated!\n");
  } catch (error) {
    console.log(error.message);
  }
}

const mainMenu = async () => {
  try {
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
          await addDepartment();
          break;
        case "Add Role":
          await addRole();
          break;
        case "Add Employee":
          await addEmployee();
          break;
        case "Update Employee Role":
          await updateEmployeeRole();
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
  } catch (error) {
    console.log(error.message);
  }
}

// Implement main() function as an IIFE to run the program
const main = (async () => {
  try {
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
  } catch (error) {
    console.log(error.message);
  }
})();

