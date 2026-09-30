const API_URL = "/api/employees";

let employees = [];

const form = document.getElementById("employeeForm");
const tableBody = document.getElementById("employeeTableBody");
const message = document.getElementById("message");

async function loadEmployees() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to fetch employees");
        }

        employees = await response.json();

        renderEmployees(employees);

    } catch (error) {
        showMessage(error.message, "error");
    }
}

function renderEmployees(data) {

    tableBody.innerHTML = "";

    data.forEach(employee => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${employee.id}</td>
            <td>${employee.name}</td>
            <td>${employee.email}</td>
            <td>${employee.role}</td>
            <td>${employee.department}</td>
            <td>
                <button
                    class="action-button edit"
                    onclick="editEmployee(${employee.id})">
                    Edit
                </button>

                <button
                    class="action-button delete"
                    onclick="deleteEmployee(${employee.id})">
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

form.addEventListener("submit", async event => {

    event.preventDefault();

    const id = document.getElementById("employeeId").value;

    const employee = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        role: document.getElementById("role").value,
        department: document.getElementById("department").value
    };

    try {

        let response;

        if (id) {

            response = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(employee)
            });

        } else {

            response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(employee)
            });
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Operation failed");
        }

        showMessage(data.message, "success");

        resetForm();

        await loadEmployees();

    } catch (error) {

        showMessage(error.message, "error");

    }
});

async function editEmployee(id) {

    try {

        const response = await fetch(`${API_URL}/${id}`);

        const employee = await response.json();

        if (!response.ok) {
            throw new Error(employee.error);
        }

        document.getElementById("employeeId").value = employee.id;
        document.getElementById("name").value = employee.name;
        document.getElementById("email").value = employee.email;
        document.getElementById("role").value = employee.role;
        document.getElementById("department").value = employee.department;

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } catch (error) {

        showMessage(error.message, "error");

    }
}

async function deleteEmployee(id) {

    if (!confirm("Are you sure you want to delete this employee?")) {
        return;
    }

    try {

        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        showMessage(data.message, "success");

        await loadEmployees();

    } catch (error) {

        showMessage(error.message, "error");

    }
}

function filterEmployees() {

    const searchTerm =
        document.getElementById("search").value.toLowerCase();

    const filtered = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm) ||
        employee.email.toLowerCase().includes(searchTerm) ||
        employee.role.toLowerCase().includes(searchTerm) ||
        employee.department.toLowerCase().includes(searchTerm)
    );

    renderEmployees(filtered);
}

function resetForm() {

    form.reset();

    document.getElementById("employeeId").value = "";

}

function showMessage(text, type) {

    message.textContent = text;

    message.className = type;

    setTimeout(() => {
        message.className = "";
        message.textContent = "";
    }, 3000);
}

loadEmployees();