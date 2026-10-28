# 📈 Stock Watchlist Dashboard — Full Stack Development Project

A clean, modern, student-level Full Stack Web Development application built using **HTML5**, **CSS3**, **Vanilla JavaScript**, **Node.js**, **Express.js**, and **MongoDB Atlas** with **Mongoose**.

Developed for academic coursework and college demonstration purposes.

---

## 📌 Project Overview

The **Stock Watchlist Dashboard** helps users search, add, view, and manage their favorite stock tickers in a clean personal dashboard. All watchlist records are stored persistently in cloud-hosted **MongoDB Atlas** and managed via a RESTful **Express.js** backend API.

> ⚠️ **Educational Disclaimer:** This application is built strictly for academic learning and portfolio evaluation. It does not perform live trading or provide financial investment advice.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | HTML5 | Web page structure and semantic content |
| **Styling** | Vanilla CSS3 | Responsive dashboard layout, flexbox/grid, indicators |
| **Logic (Client)** | Vanilla JavaScript (ES6+) | Fetch API, DOM manipulation, real-time search, modals |
| **Backend** | Node.js & Express.js | REST API server, routing, error handling, static file server |
| **Database** | MongoDB Atlas | Cloud NoSQL database storing stock documents |
| **ODM** | Mongoose | Schema validation, unique indexes, database modeling |
| **Environment** | dotenv | Keeps sensitive credentials and ports secure |
| **Tools** | VS Code & Postman | Code editing and API endpoint validation |

*No frontend frameworks (React/Angular/Vue/TypeScript) or external design libraries were used.*

---

## 📂 Project Structure

```text
stock-watchlist-dashboard/
├── .env                  # Local environment variables (Port & MongoDB URI)
├── .env.example          # Template for environment configuration
├── .gitignore            # Git exclusion rules (node_modules, .env)
├── package.json          # Project metadata, dependencies, and npm scripts
├── server.js             # Main server entry point & static file hosting
├── README.md             # Project documentation and guide
├── config/
│   └── db.js             # MongoDB Atlas connection handler using Mongoose
├── models/
│   └── Stock.js          # Mongoose Schema & validation for Stock model
├── routes/
│   └── stockRoutes.js    # REST API endpoints (GET, POST, DELETE, Health)
└── public/
    ├── index.html        # HTML structure & accessible dashboard layout
    ├── style.css         # CSS styles, financial badges, responsive design
    └── script.js         # JavaScript Fetch API logic, search & CRUD handlers
```

---

## ⚙️ Prerequisites

Before running the application, make sure you have:
1. **Node.js** (version 18 or newer) — [Download Node.js](https://nodejs.org/)
2. **Visual Studio Code** — [Download VS Code](https://code.visualstudio.com/)
3. A free **MongoDB Atlas** account — [Sign up for MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 🚀 Quick Setup & Installation Guide

### Step 1: Open the Project in VS Code
Open Visual Studio Code, click **File > Open Folder...**, and select the project folder (`stock-watchlist-dashboard`).

### Step 2: Install Node.js Dependencies
Open the integrated terminal in VS Code (`Ctrl + ~` or **Terminal > New Terminal**) and execute:
```bash
npm install
```
This automatically installs `express`, `mongoose`, `dotenv`, `cors`, and `nodemon`.

### Step 3: Configure Environment Variables
1. Check the file named `.env` in the root folder.
2. If it does not exist, copy `.env.example` to `.env`:
   - On Windows PowerShell: `cp .env.example .env`
3. Update the `MONGODB_URI` with your own MongoDB Atlas connection string:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/stock_watchlist?retryWrites=true&w=majority
   ```

### Step 4: Start the Server
- **For Development (auto-restart with Nodemon):**
  ```bash
  npm run dev
  ```
- **For Standard Production Execution:**
  ```bash
  npm start
  ```

### Step 5: Open in Your Browser
Visit your browser at:
```text
http://localhost:3000
```

---

## 🗄️ Setting Up MongoDB Atlas (Step-by-Step for Students)

1. **Create Account:** Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and register a free account.
2. **Create Cluster:** Choose the **M0 Free Tier** cluster (Shared, Free forever).
3. **Create Database User:**
   - Under **Security > Database Access**, click **Add New Database User**.
   - Choose **Password** authentication.
   - Enter a username (e.g. `student_user`) and a secure password.
   - Set privileges to **Read and write to any database**.
4. **Configure Network Access (Whitelisting IP):**
   - Under **Security > Network Access**, click **Add IP Address**.
   - Choose **Allow Access from Anywhere** (`0.0.0.0/0`) so you can connect from college/home Wi-Fi.
5. **Get Connection String:**
   - Click **Deployment > Database > Connect**.
   - Choose **Drivers** (Node.js).
   - Copy the connection string (format: `mongodb+srv://...`).
   - Replace `<password>` with the password you created in Step 3.
   - Paste it into your `.env` file as `MONGODB_URI`.

---

## 📡 REST API Documentation

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Checks server health & MongoDB status | `200 OK` |
| `GET` | `/api/stocks` | Retrieves all saved stocks (sorted newest first) | `200 OK` |
| `POST` | `/api/stocks` | Adds a new stock to watchlist | `201 Created` / `400 Bad Request` / `409 Conflict` |
| `GET` | `/api/stocks/:id` | Retrieves a single stock by MongoDB `_id` | `200 OK` / `404 Not Found` |
| `DELETE` | `/api/stocks/:id` | Deletes a stock by MongoDB `_id` | `200 OK` / `404 Not Found` |

### Sample JSON Request Body for `POST /api/stocks`:
```json
{
  "symbol": "AAPL",
  "companyName": "Apple Inc.",
  "exchange": "NASDAQ"
}
```

### Sample JSON Response for `POST /api/stocks`:
```json
{
  "success": true,
  "message": "Stock 'AAPL' added successfully to your watchlist!",
  "data": {
    "_id": "6650a12b3c4d5e6f7a8b9c0d",
    "symbol": "AAPL",
    "companyName": "Apple Inc.",
    "exchange": "NASDAQ",
    "addedAt": "2026-10-27T11:30:00.000Z",
    "__v": 0
  }
}
```

---

## 🧪 Postman API Testing Instructions

1. **Test Server Health:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/health`
2. **Add a Stock:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/stocks`
   - Header: `Content-Type: application/json`
   - Body (raw JSON): `{"symbol": "MSFT", "companyName": "Microsoft Corporation", "exchange": "NASDAQ"}`
3. **Get All Stocks:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/stocks`
4. **Test Duplicate Symbol:**
   - Repeat the `POST` request with `"MSFT"`. You should receive HTTP `409 Conflict` stating the symbol is already present.
5. **Delete a Stock:**
   - Copy the `_id` from the GET response.
   - Method: `DELETE`
   - URL: `http://localhost:3000/api/stocks/<paste_id_here>`

---

## 🛠️ Common Errors & Troubleshooting

1. **`MongoServerSelectionError` / `connect ETIMEDOUT`:**
   - **Cause:** Network access IP is not whitelisted in MongoDB Atlas.
   - **Fix:** In MongoDB Atlas, go to **Network Access > Add IP Address > Allow Access from Anywhere (`0.0.0.0/0`)**.
2. **`bad auth : authentication failed`:**
   - **Cause:** Database username or password in `.env` is incorrect.
   - **Fix:** Double-check credentials in MongoDB Atlas **Database Access**. If password contains special characters (like `@` or `%`), URL-encode them.
3. **`Error: listen EADDRINUSE: address already in use :::3000`:**
   - **Cause:** Another app or earlier Node process is using port 3000.
   - **Fix:** Change `PORT=3001` or `PORT=5000` in `.env`, or terminate the old process in Task Manager / terminal.
4. **`Cannot find module 'express'`:**
   - **Cause:** Dependencies were not installed.
   - **Fix:** Run `npm install` in the project root directory.

---

## 🎓 Academic Viva Questions & Answers

1. **Q: What is a REST API?**
   - **A:** REST (Representational State Transfer) is an architectural style for network-based software that uses standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) to transfer JSON data between client and server.
2. **Q: Why do we use Mongoose with MongoDB?**
   - **A:** MongoDB is schema-less by nature. Mongoose provides an Object Data Modeling (ODM) layer that enforces schemas, validates input types, handles unique indexes, and maps JavaScript objects to MongoDB documents.
3. **Q: How is duplicate stock symbol entry prevented?**
   - **A:** In `models/Stock.js`, the `symbol` field is defined with `unique: true`. If a duplicate is submitted, MongoDB generates error code `11000`, which our `POST` route catches and returns as an HTTP `409 Conflict`.
4. **Q: Why is `.env` added to `.gitignore`?**
   - **A:** To protect sensitive credentials (such as database passwords and secret keys) from being accidentally uploaded to public version control repositories like GitHub.
