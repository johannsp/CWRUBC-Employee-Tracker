DROP DATABASE IF EXISTS company_db;

CREATE DATABASE company_db;

USE company_db

CREATE TABLE department (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL
);

CREATE TABLE role (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(30) NOT NULL,
  salary DECIMAL(11,2) NOT NULL,
  department_id INT,
  CONSTRAINT FK_deptId FOREIGN KEY (department_id)
  REFERENCES department(id)
);

CREATE TABLE employee (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(30) NOT NULL,
  last_name VARCHAR(30) NOT NULL,
  role_id INT,
  manager_id INT,
  CONSTRAINT FK_roleId FOREIGN KEY (role_id)
  REFERENCES role(id)
);

INSERT INTO department (name)
VALUES
  ("Management"),
  ("Accounting"),
  ("Graphical Design"),
  ("Programming");

INSERT INTO role (title, salary, department_id)
VALUES
  ("Manager", 91000, 1),
  ("Accountant I", 51000, 2),
  ("Accountant II", 56000, 2),
  ("Accountant III", 61000, 2),
  ("Graphical Designer I", 52000, 3),
  ("Graphical Designer II", 57000, 3),
  ("Graphical Designer III", 62000, 3),
  ("Programmer I", 53000, 4),
  ("Programmer II", 58000, 4),
  ("Programmer III", 63000, 4);

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES
  ("Guy", "Big", 1, NULL),
  ("Bean", "Counter", 2, 1),
  ("Clyde", "Rule", 3, 2),
  ("Carry", "Parcells", 4, 3),
  ("Drew", "Easel", 7, 1),
  ("Cecile", "Clang", 10, 1),
  ("Peter", "Pascal", 9, 6),
  ("Barry", "Basic", 8, 6);

