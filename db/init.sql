CREATE DATABASE IF NOT EXISTS employee_db;

USE employee_db;

CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO employees (name, email, role, department)
VALUES
    ('Sujith', 'sujith@example.com', 'DevOps Engineer', 'DevOps'),
    ('Rahul', 'rahul@example.com', 'Software Developer', 'Engineering'),
    ('Priya', 'priya@example.com', 'QA Engineer', 'Testing');