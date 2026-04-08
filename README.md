# 🚀 Real-Time Behavior Analytics Platform

A full-stack, production-style behavior analytics platform inspired by tools like Mixpanel and Amplitude.

This system allows applications to track user events (views, cart actions, purchases) via API-key-based ingestion, process them using real-time and batch pipelines, and generate actionable insights such as DAU, retention, funnels, and segmentation through an interactive dashboard.

---

## ✨ Key Features

### 🔹 Event Ingestion
- API-key-based event tracking
- Supports single and batch event ingestion
- Session tracking and user identification

### 🔹 Real-Time + Batch Processing
- MongoDB Change Streams for real-time updates
- BullMQ workers for background aggregation
- Event-driven architecture

### 🔹 Advanced Analytics
- Total Events, Unique Users, Sessions
- DAU / WAU / MAU
- Retention Cohorts
- Funnel Analysis (view → cart → checkout → purchase)
- Event Segmentation
- Time-Series Analytics

### 🔹 Performance Optimization
- Redis caching for analytics APIs
- Cache invalidation on new events
- Pre-aggregated daily metrics for fast queries

### 🔹 Secure Multi-Tenant Architecture
- JWT authentication (access + refresh tokens)
- API-key-based project isolation
- Rate-limited ingestion endpoints

### 🔹 Interactive Dashboard
- Dynamic charts (Chart.js)
- Parallel API fetching using `Promise.all`
- Real-time analytics visualization

---

## 🏗️ Architecture Overview
Client App (Ecommerce Demo)
↓
POST /events (API Key)
↓
Event Ingestion Layer (Express.js)
↓
MongoDB (Raw Events Storage)
↓
├── Real-time processing (Change Streams)
├── Background jobs (BullMQ Workers)
└── Cache layer (Redis)
↓
Analytics APIs
↓
Dashboard UI (Charts & Insights)


---

## 📂 Project Structure


.
├── backend/
│ ├── src/
│ │ ├── controllers/
│ │ ├── services/
│ │ ├── models/
│ │ ├── routes/
│ │ ├── workers/
│ │ ├── queues/
│ │ ├── middlewares/
│ │ └── utils/
│ ├── public/
│ └── package.json
│
├── ecommerce-demo/
│ ├── public/
│ ├── src/
│ └── package.json
│
├── README.md
└── .gitignore


---

## 🧠 Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- Redis
- BullMQ (job queues)
- JWT Authentication

### Frontend
- JavaScript
- HTML/CSS
- Chart.js

---

## ⚙️ Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/tejaskrishna-work/real-time-behavior-analytics-platform.git
cd real-time-behavior-analytics-platform
