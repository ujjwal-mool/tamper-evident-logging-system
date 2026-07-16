# 🔒 Tamper-Evident Logging System

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![Flask](https://img.shields.io/badge/Flask-Web%20Framework-black)
![SHA-256](https://img.shields.io/badge/Security-SHA--256-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

A lightweight Flask-based application that secures application logs using **SHA-256 hash chaining**. The system detects unauthorized modifications, insertions, or deletions in log files and generates audit reports to verify log integrity.

---

## 📖 Overview

Logs are essential for debugging, monitoring, and security investigations. Traditional log files can be altered by attackers, making forensic analysis unreliable.

This project implements a **tamper-evident logging mechanism** where each log entry is cryptographically linked to the previous one using **SHA-256 hash chaining**. Any modification breaks the chain and is immediately detected during verification.

---

## ✨ Features

- 🔐 SHA-256 hash chaining for every log entry
- 📄 Automatic log generation
- ✅ Log integrity verification
- 🚨 Detects modified, inserted, and deleted log entries
- 📊 Generates audit reports
- 🌐 User-friendly Flask web interface
- ⚡ Lightweight and easy to deploy

---

## 🏗 System Architecture

```
              User
                │
                ▼
        Flask Web Interface
                │
        ┌───────┴────────┐
        ▼                ▼
 Generate Logs     Verify Logs
        │                │
        ▼                ▼
 SHA-256 Hashing   Chain Verification
        │                │
        ▼                ▼
  logs/logs.jsonl   Audit Report
```

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| Python | Core backend logic |
| Flask | Web application framework |
| HTML | Frontend structure |
| CSS | Styling |
| JavaScript | Client-side interactions |
| SHA-256 | Cryptographic hash chaining |
| JSONL | Log storage format |

---

## 📂 Project Structure

```
tamper-evident-logging-system/

├── app.py
├── main.py
├── README.md
├── requirements.txt
├── .gitignore
│
├── backend/
│   ├── __init__.py
│   ├── hash_chain.py
│   ├── verify_logs.py
│   ├── logfiles.py
│   └── config.py
│
├── templates/
│   └── index.html
│
├── static/
│   ├── style.css
│   └── script.js
│
├── logs/
│   └── logs.jsonl
│
├── reports/
│   └── audit_report.txt
│
├── tests/
│
└── screenshots/
```

---

## 🚀 Installation

Clone the repository

```bash
git clone https://github.com/ujjwal-mool/tamper-evident-logging-system.git
cd tamper-evident-logging-system
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run the application

```bash
python app.py
```

Open your browser

```
http://127.0.0.1:5000
```

---

## ▶️ How It Works

### 1. Generate Logs

The application creates log entries and computes a SHA-256 hash for each entry.

Each log stores:

- Timestamp
- Event
- Previous Hash
- Current Hash

---

### 2. Hash Chaining

Each new log contains the hash of the previous log.

```
Log 1
   ↓
Hash 1
   ↓
Log 2
   ↓
Hash 2
   ↓
Log 3
```

Changing any log changes its hash, breaking the chain.

---

### 3. Verification

During verification the application:

- Recomputes every hash
- Checks previous hash links
- Detects tampering
- Generates an audit report

---

## 📸 Screenshots

### Home Page

> Add a screenshot here

```
screenshots/home.png
```

### Log Verification

> Add screenshot here

```
screenshots/verification.png
```

### Audit Report

> Add screenshot here

```
screenshots/report.png
```

---

## 🔮 Future Improvements

- User authentication
- SQLite/MySQL database support
- Export reports as PDF
- Search and filter logs
- Docker deployment
- REST API
- Dark mode
- CI/CD using GitHub Actions

---

## 📚 Learning Outcomes

This project demonstrates:

- Cryptographic hashing
- Hash chaining
- Flask development
- Secure logging concepts
- File handling
- JSON processing
- Frontend integration
- Software modularization

---

## 👨‍💻 Author

**Ujjwal Moolchandani**

Computer Science and Business Systems

Dayananda Sagar College of Engineering

GitHub: https://github.com/ujjwal-mool

---

## ⭐ If you found this project useful, consider giving it a star!