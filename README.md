# Modern Library Management System

## Overview
A production-ready, full-stack Library Management System designed for modern libraries. It features a premium user interface, advanced search capabilities, automated fine management, and comprehensive analytics for administrators.

## Project Structure
The project is architected for scalability and maintainability:

1.  **frontend/**: A high-performance React application for members.
    -   **Tech**: React, Vite, Tailwind CSS, Shadcn/UI, React Query.
    -   **Key Features**: Fuzzy search, personalized recommendations, fine tracking, responsive design.
2.  **admin/**: A powerful dashboard for library staff.
    -   **Tech**: React, Vite, Tailwind CSS, Recharts.
    -   **Key Features**: Real-time analytics, inventory management, user oversight, fine processing.
3.  **backend/**: A secure and robust API.
    -   **Tech**: Node.js, Express, MongoDB, Redis (optional).
    -   **Key Features**: JWT Authentication, Role-Based Access Control (RBAC), Rate Limiting, Zod Validation.

## Key Features

### 📚 Smart Catalog & User Experience
-   **Advanced Search**: Filter by genre, author, year, and availability.
-   **Recommendations**: "You might also like" based on reading history.
-   **Reviews & Ratings**: Community-driven book ratings.
-   **Real-time Availability**: Instant status updates on book stock.

### 💳 Financial & Transaction Management
-   **Automated Fines**: System automatically calculates fines for overdue books.
-   **Rental History**: Detailed logs of all past and current transactions.
-   **Reservations**: Queue system for popular out-of-stock books.

### 🛡️ Security & Performance
-   **Secure Auth**: HttpOnly cookies, JWT access/refresh tokens.
-   **Data Validation**: Strict schema validation using Zod.
-   **Optimized**: Caching strategies and optimized database queries.

## Setup Instructions

### Prerequisites
-   Node.js (v18+)
-   MongoDB (Local or Atlas)

### Installation

1.  **Clone the repository**
2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    # Copy .env.example to .env and fill in secrets
    npm run dev
    ```
3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
4.  **Admin Setup**
    ```bash
    cd admin
    npm install
    npm run dev
    ```

## Environment Variables
Refer to `.env.example` in each directory for required configurations.
