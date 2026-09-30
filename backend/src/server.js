require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "healthy",
      database: "connected"
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected"
    });
  }
});

app.get("/api/employees", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, department FROM employees ORDER BY id DESC"
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch employees"
    });
  }
});

app.get("/api/employees/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, department FROM employees WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Employee not found"
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch employee"
    });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const { name, email, role, department } = req.body;

    if (!name || !email || !role || !department) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    const [result] = await pool.query(
      "INSERT INTO employees (name, email, role, department) VALUES (?, ?, ?, ?)",
      [name, email, role, department]
    );

    res.status(201).json({
      message: "Employee created successfully",
      id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to create employee"
    });
  }
});

app.put("/api/employees/:id", async (req, res) => {
  try {
    const { name, email, role, department } = req.body;

    if (!name || !email || !role || !department) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    const [result] = await pool.query(
      `UPDATE employees
       SET name = ?, email = ?, role = ?, department = ?
       WHERE id = ?`,
      [name, email, role, department, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Employee not found"
      });
    }

    res.json({
      message: "Employee updated successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to update employee"
    });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM employees WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Employee not found"
      });
    }

    res.json({
      message: "Employee deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to delete employee"
    });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Employee API running on port ${PORT}`);
  });
}

module.exports = app;